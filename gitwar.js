var Promise = require( 'bluebird' );
var _ = require( 'lodash-node' );
var git = require( 'gift' );
var $ = function( obj ) {
    return Promise.promisifyAll( obj );
};
var fs = $( require( 'fs' ) );
var path = require( 'path' );

var _repo = null;
var _head = null;

var MAX_COMMITS = 1000;

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

    getUsers: function() {
        Promise.all([
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

    reset: function() {
    }
};

module.exports = Gitwar;
