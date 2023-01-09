/* eslint-disable require-jsdoc */
'use strict';

const clearInputIcons = document.querySelectorAll('.clear-input-icon');

const artistInputField = document.getElementById('artistInput');
const genreInputField = document.getElementById('genreInput');
const yearsInputField = document.getElementById('yearsInput');

const artistsSearchListWrapper =
  document.getElementById('artistsSearchListWrapper');

const artistsSearchItems =
  document.getElementsByClassName('artists-search-item');

const guitarAnimationItems =
  document.querySelectorAll('.guitar-animation-item');

const shuffleButton = document.getElementById('shuffleButton');

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

const getTokenReqOptions = {
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
async function getTokenReq() {
  const tokenReqObj = await fetch('https://accounts.spotify.com/api/token',
      getTokenReqOptions);

  const tokenReqRes = await tokenReqObj.json();

  token = 'Bearer ' + tokenReqRes.access_token;

  // when token expired
  setTimeout(() => {
    token = null;
    getTokenReq();
  }, 3500000);

  // remove this later
  console.log('token got');

  return token;
}
getTokenReq();

// getTokenReq()
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
    const artistImg = artist.images.length ? artist.images[2].url : 'https://www.svgrepo.com/show/227922/musician.svg';
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

function animateGuitarButton(cancel) {
  if (cancel) {
    guitarAnimationItems.forEach((item) =>{
      item.getAnimations().forEach((item) => {
        item.cancel();
      });
    });
    return;
  };

  guitarAnimationItems.forEach((item, index) => {
    item.animate(
        [
          {opacity: 0.3},
          {opacity: 1, offset: 0.6},
          {opacity: 1},
        ], {
          duration: 1500,
          delay: index * 350,
          easing: 'ease-in-out',
          iterations: Infinity,
          direction: 'alternate-reverse',
        },
    );
  });
}

shuffleButton.addEventListener('click', getItemsReq);

let getItemsReqIsProcessing = false;
async function getItemsReq() {
  // don't make extra requests
  if (getItemsReqIsProcessing) return;
  getItemsReqIsProcessing = true;

  animateGuitarButton();

  const query = getItemsReqQueryMaker();

  const OffsetNum = await randomOffsetNumGenReq(query);

  const getItemsReqObj = await fetch(`https://api.spotify.com/v1/search?${query}&type=track&include_external=audio&limit=50&offset=${OffsetNum}`, {
    headers: {
      Authorization: token,
    },
  });

  const getItemsReqRes = await getItemsReqObj.json();

  const getItemsReqResLength = getItemsReqRes.tracks.items.length;
  const randomNumber = Math.floor(Math.random() * getItemsReqResLength);

  const randomSelectedItem = getItemsReqRes.tracks.items[randomNumber];
  
  const trackName = randomSelectedItem.name;
  const trackDemo = randomSelectedItem.preview_url;
  const trackLink = randomSelectedItem.external_urls.spotify;
  const trackAlbumName = randomSelectedItem.album.name;
  const trackAlbumLink = randomSelectedItem.album.external_urls.spotify;
  // get cover based on screen resolution
  // const trackCover = randomSelectedItem.album[2].url;
  // iterate over artists
  const trackArtists = randomSelectedItem.artists[0].name;
  const trackArtistsLinks = randomSelectedItem.artists[0].external_urls.spotify;

  animateGuitarButton(true);
  getItemsReqIsProcessing = false;

  console.log(getItemsReqRes);

  return randomSelectedItem;
}

async function randomOffsetNumGenReq(query) {
  const totalItemsNumReqObj = await fetch(`https://api.spotify.com/v1/search?${query}&type=track&include_external=audio&limit=50`, {
    headers: {
      Authorization: token,
    },
  });

  const totalItemsNumReqRes = await totalItemsNumReqObj.json();

  const totalItemsNum = totalItemsNumReqRes.tracks.total;

  // offset > 950 lead to error
  const randomOffsetNum = totalItemsNum >= 950 ?
  Math.floor(950 * Math.random()) :
  Math.floor(totalItemsNum * Math.random());

  return randomOffsetNum;
}

function standardizeInputFields() {
  // artist input field
  const standardizedArtistInputField = artistInputFieldStandardize();

  // genre input field
  const trimmedGenreInputField = genreInputField.value.trim();
  const standardizedGenreInputField =
    trimmedGenreInputField.replaceAll(' ', '-');

  // years input field
  const trimmedYearsInputField = yearsInputField.value.trim();
  const standardizedYearsInputField =
    trimmedYearsInputField.replaceAll(' ', '-');

  return [standardizedArtistInputField,
    standardizedGenreInputField,
    standardizedYearsInputField];
}

function getItemsReqQueryMaker() {
  let [artist, genre, years] = standardizeInputFields();

  // empty filters or extra spaces have effect on results!
  artist = artist ? 'artist:' + artist + '%20' : '';
  genre = genre ? 'genre:' + genre + '%20' : '';
  years = years ? 'year:' + years : '';

  let randomStr = '';
  // randomStr when artist field is filled, doesn't make good responses
  if (artist == '') {
    randomStr = randomStrGenerator(3) + '%20';
  }

  const query = `q=${randomStr}${artist}${genre}${years}`;

  return query;
}

function randomStrGenerator(length) {
  let randomString = '';

  const characters = 'abcdefghijklmnopqrstuvwxyz';
  for ( let i = 0; i < length; i++ ) {
    const randomIndex = characters.length * Math.random();
    randomString += characters.charAt(Math.floor(randomIndex));
  }

  return randomString;
}
