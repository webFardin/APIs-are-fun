/* eslint-disable require-jsdoc */
'use strict';

const clearInputIcons = document.querySelectorAll('.clear-input-icon');

const artistInputField = document.getElementById('artistInput');

const artistsSearchListWrapper =
document.getElementById('artistsSearchListWrapper');

const artistsSearchItems =
document.getElementsByClassName('artists-search-item');

clearInputIcons.forEach((icon) => icon.addEventListener('mousedown', (e) => {
  e.preventDefault();

  const input =
  document.querySelector(`input#${e.currentTarget.dataset.input}`);

  input.value = '';
  artistsSearchListWrapper.textContent = '';
  input.focus();
}));

// x-www-form-urlencoded type of request body: need URL();
const encodedBody = new URLSearchParams();
encodedBody.append('grant_type', 'client_credentials');

const getTokenRequestOptions = {
  method: 'POST',
  headers: {
    'Authorization':
    // This is webFardin's personal key, please don't use it
    // eslint-disable-next-line max-len
    'Basic ZDQ2OGY4Yjg5MDMwNDJlNThlYmEyNjY5YTQ2MDFhZWQ6OTJjMmJlZmJhMTNjNDZjYjk0YTFiN2RmOGEzMjFhMDQ=',
  },
  body: encodedBody,
};

let token;
async function tokenRequest() {
  const tokenReqObj = await fetch('https://accounts.spotify.com/api/token',
      getTokenRequestOptions);

  const tokenReqRes = await tokenReqObj.json();

  token = 'Bearer ' + tokenReqRes.access_token;

  // when token expired
  setTimeout(() => {
    token = null;
    tokenRequest();
  }, 3500000);

  // remove this later
  console.log('token got');

  return token;
}
tokenRequest();

// tokenRequest()
// // customize catch later...
//     .catch((error) => console.log('error in getting token', error));
// ;

async function artistInfoReq(artistName) {
  const artistReqObj = await fetch(`https://api.spotify.com/v1/search?q=${artistName}&type=artist&limit=3`, {
    headers: {
      Authorization: token,
    },
  });

  const artistReqRes = await artistReqObj.json();

  return artistReqRes.artists.items;
}

artistInputField.addEventListener('input', artistSearchInputFieldEvent);

// this variable is for checking that just last artistInfoReq to be apply
let artistInfoReqNum= 0;
async function artistSearchInputFieldEvent(e) {
  const artistName = artistInputFieldStandardize();

  // if input is just free space, clear search list and don't send request
  if (artistName == '') {
    artistsSearchListWrapper.textContent = '';
    return;
  };

  // increase req number and save it locally to check later
  artistInfoReqNum++;
  const localArtistInfoReqNum = artistInfoReqNum;

  const artistsArr = await artistInfoReq(artistName);

  // if some reqs sent after this req, do nothing
  if (localArtistInfoReqNum != artistInfoReqNum) return;

  // if previous Reqs done after search list cleared, do nothing more
  if (artistInputFieldStandardize() == '') return;

  artistsSearchListShower(artistsArr);
}

function artistInputFieldStandardize() {
  const inputValue = artistInputField.value;
  const trimmedInputValue = inputValue.trim();
  const standardizedName = encodeURIComponent(trimmedInputValue);

  return standardizedName;
}

function artistsSearchListShower(artistsArr) {
  artistsSearchListWrapper.textContent = '';

  artistsArr.forEach((artist) => {
    // condition is for when image is not available
    const artistImg = artist.images.length ? artist.images[2].url : 'https://cdn.iconscout.com/icon/premium/png-256-thumb/music-artist-5701091-4778392.png';
    const artistName = artist.name || 'unknown';

    artistsSearchListWrapper.innerHTML += `
    <div class="artists-search-item" data-artist-name="${artistName}">
              <img
                src="${artistImg}"
                alt="artist image"
                class="artists-search-item-img"
              />
              <span class="artists-search-item-name">${artistName}</span>
            </div>
    `;
  });

  const artistsSearchItemsArr = Array.from(artistsSearchItems);

  artistsSearchItemsArr.forEach((artistItem) => {
    artistItem.addEventListener('mousedown', (e)=> {
      artistInputField.value = e.currentTarget.dataset.artistName;
      artistSearchInputFieldEvent();
    });
  });
}
