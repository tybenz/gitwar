var Promise = require( 'bluebird' );
var _ = require( 'lodash-node' );
var git = require( 'regift' );
var $ = function( obj ) {
    return Promise.promisifyAll( obj );
};
var fs = $( require( 'fs' ) );
var path = require( 'path' );

var _repo = null;
var _head = null;

var MAX_COMMITS = 1000;

var pad = function( n, width, z ) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array( width - n.length + 1 ).join( z ) + n;
};

var Gitwar = {
    me: null,

    opponent: null,

    init: function() {
        _repo = $( git( process.cwd() ) );
        return Promise.all( [ this.head(), this.getUsers() ] );
    },

    addLog: function( message ) {
        message = JSON.stringify( _.extend( { user: Gitwar.me }, message ) ).replace( /"/g, '\\"' );

        return _repo.commitAsync( message, { all: true, 'allow-empty': true } )
        .then( function() {
            return Gitwar.head();
        });
    },

    logs: function() {
        return _repo.commitsAsync( 'master', MAX_COMMITS )
        .then( function( commits ) {
            return _.reduce( commits, function( memo, com ) {
                try {
                    var obj = JSON.parse( com.message );
                    if ( obj.user ) {
                        memo.push( obj );
                    }
                } catch ( e ) {
                    // Nothing happens - try/catch to safeguard against commits
                    // that aren't JSON parse-able
                }

                return memo;
            }, [] );
        });
    },

    masterUser: function() {
        return Gitwar.users[ 0 ] == Gitwar.me;
    },

    getUsers: function() {
        return Promise.all([
            fs.readFileAsync( path.join( process.cwd(), 'users.json' ) ),
            _repo.configAsync()
        ])
        .then( function( results ) {
            var file = results[ 0 ];
            var config = results[ 1 ];

            Gitwar.users = JSON.parse( file );

            _.each( Gitwar.users, function( user ) {
                if ( user == config.items[ 'user.name' ] ) {
                    Gitwar.me = user;
                } else {
                    Gitwar.opponent = user;
                }
            });

            return Gitwar.users;
        });
    },

    head: function() {
        return _repo.commitsAsync()
        .then( function( commits ) {
            _head = commits[ 0 ].id;
            return JSON.parse( commits[ 0 ].message );
        });
    },

    sync: function() {
        return _repo.syncAsync()
        .then( function() {
            Gitwar.head();
        });
    },

    poll: function( fn ) {
        _repo.pullAsync()
        .bind( this )
        .then( function() {
            return _repo.commitsAsync();
        })
        .then( function( commits ) {
            // check HEAD to see if it matches our current head
            if ( commits[ 0 ].id == _head ) {
                return Gitwar.poll( fn );
            } else {
                fn( JSON.parse( commits[ 0 ].message ) );
            }
        });
    },

    newGame: function() {
        var newBranchName = '';

        return _repo.branchAsync()
        .then( function( branch ) {
            var branchName = branch.name;
            var regex = /^[^0-9]*/;
            var branchRoot = branch.name.match( regex )[ 0 ];
            var gameNum = parseInt( branchName.replace( /^[^0-9]*/, '' ) );
            newBranchName = branchRoot + pad( gameNum + 1, 3 );
            return _repo.checkoutAsync( newBranchName, { orphan: true } );
        })
        .then( function( newBranch ) {
            return _repo.addAsync( [ 'users.json' ] );
        })
        .then( function() {
            return _repo.commitAsync( '{ "start": true }' );
        })
        .then( function() {
            return _repo.pushAsync( 'origin', newBranchName );
        })
        .then( function() {
            return newBranchName;
        });
    },

    reset: function() {
    }
};

module.exports = Gitwar;
