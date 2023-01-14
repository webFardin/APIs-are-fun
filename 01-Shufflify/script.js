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

const resultPanel = document.getElementById('resultPanel');
const trackImg = document.getElementById('trackImg');
const trackNameElem = document.getElementById('trackNameElem');
const trackArtistName = document.getElementById('trackArtistName');
const closePanelBtn = document.getElementById('closePanelBtn');
const playPanelBtn = document.getElementById('playPanelBtn');
const playingPanelBtn = document.getElementById('playingPanelBtn');
const spotifyPanelBtn = document.getElementById('spotifyPanelBtn');
const audioElem = document.getElementById('audioElem');

clearInputIcons.forEach((icon) => icon.addEventListener('mousedown', (e) => {
  e.preventDefault();

  const input =
  document.querySelector(`input#${e.currentTarget.dataset.input}`);

  input.value = '';
  artistsSearchListWrapper.textContent = '';
  input.focus();
}));

// x-www-form-urlencoded type of request body: need URL();
const encodedGetTokenReqBody = new URLSearchParams();
encodedGetTokenReqBody.append('grant_type', 'client_credentials');

const getTokenReqOptions = {
  method: 'POST',
  headers: {
    'Authorization':
    // This is webFardin's personal key, please don't use it
    // eslint-disable-next-line max-len
    'Basic ZDQ2OGY4Yjg5MDMwNDJlNThlYmEyNjY5YTQ2MDFhZWQ6OTJjMmJlZmJhMTNjNDZjYjk0YTFiN2RmOGEzMjFhMDQ=',
  },
  body: encodedGetTokenReqBody,
};

let token;
let getTokenReqIsProcessing = false;
localStorage.getItem('token') ? token = localStorage.getItem('token') :
getTokenReq();

async function getTokenReq() {
  if (getTokenReqIsProcessing) return;
  getTokenReqIsProcessing = true;
  getTokenReqAnimation();

  const tokenReqObj = await fetch('https://accounts.spotify.com/api/token',
      getTokenReqOptions);

  const tokenReqRes = await tokenReqObj.json();

  token = 'Bearer ' + tokenReqRes.access_token;

  localStorage.setItem('token', token);

  getTokenReqAnimation('cancel');
  getTokenReqIsProcessing = false;

  return token;
}

function getTokenReqAnimation(cancel) {
  if (cancel) {
    document.querySelector('.getTokenReqAnimWrapper').remove();
    return;
  }

  const getTokenReqAnimWrapper = document.createElement('div');
  getTokenReqAnimWrapper.classList.add('getTokenReqAnimWrapper');

  const getTokenReqAnimBox = document.createElement('div');
  getTokenReqAnimBox.classList.add('getTokenReqAnimBox');

  const getTokenReqAnim = document.createElement('div');
  getTokenReqAnim.classList.add('getTokenReqAnim');

  document.body.append(getTokenReqAnimWrapper);
  getTokenReqAnimWrapper.append(getTokenReqAnimBox);
  getTokenReqAnimBox.append(getTokenReqAnim);
}

async function artistInfoReq(artistName) {
  if (getTokenReqIsProcessing) return;
  const artistReqObj = await fetch(`https://api.spotify.com/v1/search?q=${artistName}&type=artist&limit=3`, {
    headers: {
      Authorization: token,
    },
  });

  // if token expired
  if (artistReqObj.status == 401) {
    await getTokenReq();
    artistInputField.dispatchEvent(new Event('input'));
    return;
  }

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

  // when token expired in artistInfoReq()
  if (artistsArr == undefined) return;

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
    const artistGenres = artist.genres.map((genre) => genre).join(', ');

    artistsSearchListWrapper.innerHTML += `
    <div class="artists-search-item" data-artist-name="${artistName}"
    data-artist-genres="${artistGenres}">
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
      genreInputField.value = e.currentTarget.dataset.artistGenres;
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
          {opacity: 1, offset: 0.8},
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
yearsInputField.addEventListener('keydown', (e) => {
  if (e.key == 'Enter') {
    getItemsReq();
  }
});

let getItemsReqIsProcessing = false;
async function getItemsReq() {
  // don't make extra requests
  if (getItemsReqIsProcessing) return;
  getItemsReqIsProcessing = true;

  animateGuitarButton();

  const query = getItemsReqQueryMaker();

  const OffsetNum = await randomOffsetNumGenReq(query);

  // when token expired or result is empty in randomOffserNumGenReq()
  if (OffsetNum == undefined) return;

  const getItemsReqObj = await fetch(`https://api.spotify.com/v1/search?${query}&type=track&include_external=audio&limit=50&offset=${OffsetNum}`, {
    headers: {
      Authorization: token,
    },
  });

  // if token expired
  if (getItemsReqObj.status == 401) {
    await getTokenReq();
    animateGuitarButton('cancel');
    getItemsReqIsProcessing = false;
    getItemsReq();
    return;
  }

  const getItemsReqRes = await getItemsReqObj.json();

  const getItemsReqResLength = getItemsReqRes.tracks.items.length;
  const randomNumber = Math.floor(Math.random() * getItemsReqResLength);

  const randomSelectedItem = getItemsReqRes.tracks.items[randomNumber];

  trackPanelShower(randomSelectedItem);

  animateGuitarButton('cancel');
  getItemsReqIsProcessing = false;


  return randomSelectedItem;
}

async function randomOffsetNumGenReq(query) {
  const totalItemsNumReqObj = await fetch(`https://api.spotify.com/v1/search?${query}&type=track&include_external=audio&limit=50`, {
    headers: {
      Authorization: token,
    },
  });

  // if token expired
  if (totalItemsNumReqObj.status == 401) {
    await getTokenReq();
    animateGuitarButton('cancel');
    getItemsReqIsProcessing = false;
    getItemsReq();
    return;
  }

  const totalItemsNumReqRes = await totalItemsNumReqObj.json();

  const totalItemsNum = totalItemsNumReqRes.tracks.total;

  if (totalItemsNum == 0) {
    const [artist, genre] = standardizeInputFields();
    getItemsReqIsProcessing = false;
    animateGuitarButton('cancel');
    if (artist && genre) {
      genreInputField.value = '';
      getItemsReq();
      return;
    }
    noResultErrShower();
    return;
  }

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
    trimmedYearsInputField.replaceAll(' ', '');

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
    randomStr = randomStrGenerator(1) + '%20';
  }

  const query = `q=${randomStr}${artist}${genre}${years}`;

  return query;
}

function randomStrGenerator(length) {
  let randomString = '';

  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for ( let i = 0; i < length; i++ ) {
    const randomIndex = characters.length * Math.random();
    randomString += characters.charAt(Math.floor(randomIndex));
  }

  return randomString;
}

function trackPanelShower(track) {
  const trackName = track.name;
  const trackDemo = track.preview_url;
  const trackLink = track.external_urls.spotify;
  let trackCoverQuality;
  switch (true) {
    case window.innerWidth < 128:
      trackCoverQuality = 2;
      break;

    case window.innerWidth < 600:
      trackCoverQuality = 1;
      break;

    case window.innerWidth > 600:
      trackCoverQuality = 0;
      break;

    default:
      break;
  }
  const trackCover = track.album.images.length ? track.album.images[trackCoverQuality].url : 'https://www.svgrepo.com/show/480240/music-file-1.svg';
  const trackArtists = track.artists.map((artist) => artist.name).join(', ');

  resultPanel.style.display = 'flex';
  trackNameElem.textContent = trackName;
  trackImg.src = '';
  trackImg.src = trackCover;
  trackArtistName.textContent = trackArtists;
  spotifyPanelBtn.href = trackLink;
  audioElem.src = trackDemo;
}

playPanelBtn.addEventListener('click', (e) => {
  playPanelBtn.style.display = 'none';
  playingPanelBtn.style.display = 'initial';
  audioElem.play();
});

playingPanelBtn.addEventListener('click', audioPaused);
function audioPaused() {
  playingPanelBtn.style.display = '';
  playPanelBtn.style.display = '';
  audioElem.pause();
}

audioElem.addEventListener('pause', audioPaused);

closePanelBtn.addEventListener('click', (e) => {
  resultPanel.style.display = '';
  audioPaused();
  audioElem.src = '';
});

function noResultErrShower() {
  const errorElemWrapper = document.createElement('div');
  errorElemWrapper.classList.add('error-elem-wrapper');
  errorElemWrapper.textContent = `I didn\'t find anything!
  \nI think you should change filters!`;

  document.body.append(errorElemWrapper);

  setTimeout(() => {
    document.querySelector('.error-elem-wrapper').remove();
  }, 2000);
}
