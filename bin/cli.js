#!/usr/bin/env node
var program = require( 'commander' );
var Gitwar = require( '../gitwar' );
var _ = require( 'lodash-node' );
var Promise = require( 'bluebird' );
var OAuth2 = require( 'oauth' ).OAuth2;
var $ = function( obj ) {
  return Promise.promisifyAll( obj, {
      filter: function() { return true; }
  });
};
var fs = $( require( 'fs' ) );
var oauth = $(
    new OAuth2(
        '',
        '',
        'https://api.github.com/',
        null,
        'oauth2/token',
        null
    )
);
var getHomeDir = function() {
    return process.env[ process.platform == 'win32' ? 'USERPROFILE' : 'HOME' ];
};

var CLI = {
    githubLogin: function() {
        var username;
        var password;

        return fs.readFileAsync( getHomeDir() + '/.gitwar' )
        .bind( this )
        .then( function( file ) {
            var data = JSON.parse( file );
            this._username = data.username;
            this._accessToken = data.access_token;
        })
        .catch( function( err ) {
            // JSON didn't parse or file did not exist
            return oauth._requestAsync(
                'POST',
                'https://api.github.com/authorizations',
                { 'Authorization': 'Basic ' + new Buffer( username + ':' + password ).toString( 'base64' ) },
                JSON.stringify({
                    scopes: [ 'public_repo' ],
                    note: 'Gitwar'
                }),
                null
            )
            .bind( this )
            .then( function( response ) {
                console.log('GOOD', response[0]);
                var data = JSON.parse( response[ 0 ] );
                return this.saveAccessToken({
                    access_token: data.token,
                    username: username
                });
            })
            .catch( function( err ) {
                try {
                    console.log(err);
                    var data = JSON.parse( err.data );
                    if ( data.token ) {
                        // successful login
                        return this.saveAccessToken({
                            access_token: data.token,
                            username: username
                        });
                    } else {
                        throw err;
                    }
                } catch ( e ) {
                    console.log( 'ERR!', e );
                }
            });
        });
    },

    saveAccessToken: function( data ) {
        this._accessToken = data.token;
        this._username = data.username;
        fs.writeFileAsync( getHomeDir() + '/.gitwar', JSON.stringify( data ) );
    }
};

CLI.githubLogin();

module.exports = CLI;
