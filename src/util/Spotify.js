const clientId = 'ac0a064793504d00b245ada3ccb0aeab';
const redirectURI = 'http://localhost:3000/'
let accessToken;
let expiresIn;

const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return new Promise(resolve => resolve(accessToken));
    }
    else {
      const accessTokenExists = window.location.href.match(/access_token=([^&]*)/);
      const expiresInExists = window.location.href.match(/expires_in=([^&]*)/);
      if (accessTokenExists && expiresInExists) {
        accessToken = accessTokenExists[1];
        expiresIn = expiresInExists[1];
        window.setTimeout(() => accessToken = '', expiresIn * 1000);
        window.history.pushState('Access Token', null, '/');
      }
      else {
        window.location = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`
      }
      return new Promise(resolve => resolve(accessToken));
    }
  },

  search(term) {
    return Spotify.getAccessToken().then(() => {
      return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`,
        {
          headers: {Authorization: `Bearer ${accessToken}`}
        }
      ).then(response => {
        return response.json();
      }).then(jsonResponse => {
        if (jsonResponse.tracks) {
          return jsonResponse.tracks.items && jsonResponse.tracks.items.map(track => {
            return {
              id: track.id,
              name: track.name,
              artist: track.artists[0].name,
              album: track.album.name,
              uri: track.uri
            };
          });
        }
        else {
          return [];
        }
      });
    });
  },

  savePlaylist(name, trackURIs) {
    // I took this out because it caused an error if one of these were empty or null
    // if (!name || !trackURIs.length) {
    //   return console.log("Nothing there!");
    // }
    // else {

    let userId;
    return Spotify.getAccessToken().then(() => {
      return fetch('https://api.spotify.com/v1/me',
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      ).then(response => {
        return response.json()
      }).then(jsonResponse => {
        userId = jsonResponse.id;
        console.log('UserId: ' + userId);
        return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            method: 'POST',
            body: JSON.stringify({name: name})
          }
        )
      }).then(response => {
        return response.json()
      }).then(jsonResponse => {
        const playlistId = jsonResponse.id;
        console.log('playlistId: ' + playlistId);
        return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`,
          {
            headers: { Authorization: `Bearer ${accessToken}`},
            method: 'POST',
            body: JSON.stringify({uris: trackURIs})
          }
        );
      });
    }); //}
  }
}

export default Spotify;
