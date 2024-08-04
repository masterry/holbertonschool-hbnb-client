document.addEventListener('DOMContentLoaded', () => {
  const loginform = document.getElementById('login-form');
  const authorizetoken = getCookieToken('token');
  const loginLink = document.getElementById('login-link');
  const countryFilter = document.getElementById('country-filter');

  function getCookieToken(name) {
    const cookies = new URLSearchParams(document.cookie.replace(/; /g, '&'));
    return cookies.get(name)
  }


  if (loginform) {
    loginform.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const response = await loginUser(email, password);

        if (response.ok) {
          const data = await response.json();
          document.cookie = `token=${data.access_token}; path=/; secure; samesite=strict`;
          window.location.href = 'index.html';
        } else {
          const errorData = await response.json();
          alert('Login Failed: ' + (errorData.message || response.statusText));
        }
      } catch (error) {
        alert('An error occured: ' + error.message);
      }
    });
  }

  if (authorizetoken) {
    loginLink.style.display = 'none';
  } else {
    loginLink.style.display = 'block';
  }

  fetchPlaces(authorizetoken);

  async function loginUser(email, password) {
    return await fetch('http://127.0.0.1:5000/login', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
  }

  async function fetchPlaces(authorizetoken) {
    try {
      const response = await fetch('http://127.0.0.1:5000/places', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authorizetoken}`
        }
      });
      if (response.ok) {
        const places = await response.json();
        populateCountryFilter(places);
        displayPlaces(places);

        countryFilter.addEventListener('change', () => {
          const country = countryFilter.value;
          const filteredPlaces = filterPlaces(places, country);
          displayPlaces(filteredPlaces);
        });
      } else {
        alert('Failed to fetch places: ' + response.statusText);
      }
    } catch (error) {
      console.error('An error occured: ', error);
    }
  }

  function displayPlaces(places) {
    const placeList = document.getElementById('places-list');
    placeList.innerHTML = '';
    places.forEach(place => {
      const placeItem = document.createElement('div');
      placeItem.className = 'place-card';
      placeItem.innerHTML = `
      <img src='./images/place-image.jpg' alt="Image" class="place-image">
      <h3>Place Name: ${place.id}</h3>
      <p>Host: ${place.host_name}</p>
      <p>Price per night ${place.price_per_night}</p>
      <p>Location: ${place.city_name}, ${place.country_name}</p>
      <button class="details-button" onclick="location.href='place.html?id=${place.id}'">View Details</button>`;
      placeList.append(placeItem);
    });
  }

  function populateCountryFilter(places) {
    const countries = [... new Set(places.map(place => place.country_name))];
    countryFilter.innerHTML = '<option value="All">All</option>';
    countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country;
      option.textContent = country;
      countryFilter.appendChild(option);
    });
  }

  function filterPlaces(places, country) {
    if (!country) return places;
    if (countryFilter.value === 'All') return places;
    return places.filter(place => place.country_name === country);
  }

  const placeId = getPlaceId();

  if (placeId) {
    loginLink.style.display = 'none';
    fetchDetailedPlace(authorizetoken, placeId);
  } else {
    loginLink.style.display = 'block';
  }

  function getPlaceId() {
    const query = window.location.search;
    const result = new URLSearchParams(query);
    const id = result.get('id');
    return id;
  }

  async function fetchDetailedPlace(authorizetoken, placeId) {
    try {
      const response = await fetch(`http://127.0.0.1:5000/places/${placeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authorizetoken}`
        }
      });
      if (response.ok) {
        const place = await response.json();
        console.log(place)
        displayDetailedPlace(place);
      } else {
        console.error('Failed to load place: ', response.statusText);
      }
    } catch (error) {
      console.error('Error: ', error);
    };
  }

  function getStarRating(rating) {
    const fullStar = '★';
    const emptyStar = '☆';
    const starCount = 5;
    let stars = '';

    for (let i = 0; i < starCount; i++) {
      if (i < rating) {
        stars += fullStar;
      } else {
        stars += emptyStar;
      }
    }
    return stars;
  }

  function displayDetailedPlace(place) {
    const placeDetails = document.getElementById('place-details');
    const placeElements = document.createElement('div');
    placeElements.innerHTML = `
    <h1>${place.id}</h1>
      <div class="container">
        <img src='./images/place-image.jpg' alt="Image" class="place-image-large">
      </div>
      <div class="place-info">
        <p><b>Host:</b> ${place.host_name}</p>
        <p><b>Price pre night:</b> $${place.price_per_night}</p>
        <p><b>Description:</b> ${place.description}</p>
        <p><b>Location:</b> ${place.city_name},<${place.country_name},${place.county_code}</p>
        <p><b>Amenities:</b> ${place.amenities.join(", ")}</p>
      </div>`;
    placeDetails.appendChild(placeElements);

    const reviewSection = document.getElementById('reviews');
    const reviews = place.reviews;
    reviews.forEach(review => {
      const reviewCard = document.createElement('div');
      reviewCard.className = 'review-card';
      reviewCard.innerHTML = `
      <p><b>${review.user_name}</b></p>
      <p>Rating: ${getStarRating(review.rating)}</p>
      <p>"${review.comment}"</p>
      `;
      reviewSection.appendChild(reviewCard);
    });
  }

  const reviewForm = document.getElementById('review-form');

  if (reviewForm) {
    reviewForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const reviewText = document.getElementById('review').value;
      const rating = document.getElementById('rating').value;
      submitReview(authorizetoken, placeId, rating, reviewText);
    });
  }

  async function submitReview(authorizetoken, placeId, rating, reviewText) {
    try {
      const response = await fetch(`http://127.0.0.1:5000/places/${placeId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authorizetoken}`
        },
        body: JSON.stringify({ rating: rating, review: reviewText })
      });
      if (response.ok) {
        alert('Review added successfully!');
        window.location.reload();
      } else {
        alert('Failed to add submission');
      }
    } catch (error) {
      console.error('Error submitting review', error);
    }
  }
});