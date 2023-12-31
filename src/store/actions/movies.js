import { GET_MOVIES, SELECT_MOVIE, GET_SUGGESTIONS } from '../types';
import { setAlert } from './alert';
import { auth } from '../../firebase/authConfig';
import { storage, db } from '../../firebase/dbConfig';
import {
  doc,
  addDoc,
  setDoc,
  updateDoc,
  getDocs,
  getDoc,
  collection,
  deleteDoc
} from 'firebase/firestore';
import {
  getDownloadURL,
  ref,
  uploadBytes,
  uploadBytesResumable
} from 'firebase/storage';

export const uploadMovieImage = (id, image) => async dispatch => {
  try {
    
    const imageRef = ref(storage, `movieImages/${image.name + id}`);
    const uploadTask = uploadBytesResumable(imageRef, image);
    uploadTask.on(
      'state_changed',
      snapshot => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
        switch (snapshot.state) {
          case 'paused':
            console.log('Upload is paused');
            break;
          case 'running':
            console.log('Upload is running');
            break;
        }
      },
      error => {
        dispatch(setAlert(error.message, 'error', 5000));
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async downloadURL => {
          const movieDocRef = doc(db, 'movies', id);
          await updateDoc(movieDocRef, {
            
            image: downloadURL
          });
          dispatch(setAlert('Image Uploaded', 'success', 5000));
        });
      }
    );
  } catch (error) {
    dispatch(setAlert(error.message, 'error', 5000));
  }
};

export const getMovies = () => async dispatch => {
  try {
    // const url = '/movies';
    // const response = await fetch(url, {
    //   method: 'GET',
    //   headers: { 'Content-Type': 'application/json' }
    // });
    // const movies = await response.json();
    const querySnapshot = await getDocs(collection(db, 'movies'));

    var movies = [];
    querySnapshot.forEach(doc => {
      // doc.data() is never undefined for query doc snapshots
      movies.push(doc.data());
      console.log(doc.id, ' => ', doc.data());
    });
    console.log(movies);
    // if (response.ok) {
    dispatch({ type: GET_MOVIES, payload: movies });
    // }
  } catch (error) {
    dispatch(setAlert(error.message, 'error', 5000));
  }
};

export const onSelectMovie = movie => ({
  type: SELECT_MOVIE,
  payload: movie
});

export const getMovie = id => async dispatch => {
  try {
    // const url = '/movies/' + id;
    // const response = await fetch(url, {
    //   method: 'GET',
    //   headers: { 'Content-Type': 'application/json' }
    // });
    // const movie = await response.json();
    // if (response.ok) {
    //   dispatch({ type: SELECT_MOVIE, payload: movie });
    // }
    const docRef = doc(db, 'movies', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log('Document data:', docSnap.data());
      dispatch({ type: SELECT_MOVIE, payload: docSnap.data() });
    } else {
      // doc.data() will be undefined in this case
      console.log('No such document!');
    }
    
  } catch (error) {
    dispatch(setAlert(error.message, 'error', 5000));
  }
};

export const getMovieSuggestion = id => async dispatch => {
  try {
    const url = '/movies/usermodeling/' + id;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const movies = await response.json();
    if (response.ok) {
      dispatch({ type: GET_SUGGESTIONS, payload: movies });
    }
  } catch (error) {
    dispatch(setAlert(error.message, 'error', 5000));
  }
};

export const addMovie = (image, newMovie) => async dispatch => {
  try {
    // const token = localStorage.getItem('jwtToken');
    // const url = '/movies';
    // const response = await fetch(url, {
    //   method: 'POST',
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(newMovie)
    // });
    // const docRef = doc(collection(db,"movies"));
    // const movie = await setDoc()

    // if (response.ok) {
    //   dispatch(setAlert('Movie have been saved!', 'success', 5000));
    //   if (image) dispatch(uploadMovieImage(movie._id, image));
    //   dispatch(getMovies());
    // }
    const docRef = await addDoc(collection(db, 'movies'), {
      title: newMovie.title,
      image: '',
      genre: newMovie.genre,
      language: newMovie.language,
      duration: newMovie.duration,
      description: newMovie.description,
      director: newMovie.director,
      cast: newMovie.cast,
      releaseDate: newMovie.releaseDate,
      endDate: newMovie.endDate
    });

    if (docRef) {
      const movieDocRef = doc(db, 'movies', docRef.id);
          await updateDoc(movieDocRef, {
            _id: docRef.id,
           
          });
      dispatch(setAlert('Movie have been saved!', 'success', 5000));
      if (image) dispatch(uploadMovieImage(docRef.id, image));
      dispatch(getMovies());
    }

    console.log(newMovie.title);
  } catch (error) {
    dispatch(setAlert(error.message, 'error', 5000));
  }
};

export const updateMovie = (movieId, movie, image) => async dispatch => {
  try {
    // const token = localStorage.getItem('jwtToken');
    // const url = '/movies/' + movieId;
    // const response = await fetch(url, {
    //   method: 'PUT',
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(movie)
    // });
    // if (response.ok) {
    //   dispatch(onSelectMovie(null));
    //   dispatch(setAlert('Movie have been saved!', 'success', 5000));
    //   if (image) dispatch(uploadMovieImage(movieId, image));
    //   dispatch(getMovies());
    // }

    
    const movieDocRef = doc(db, 'movies', movieId);
    await updateDoc(movieDocRef, movie);
    
        dispatch(onSelectMovie(null));
        dispatch(setAlert('Movie have been saved!', 'success', 5000));
        if (image) dispatch(uploadMovieImage(movieId, image));
        dispatch(getMovies());
      
    
  } catch (error) {
    dispatch(setAlert(error.message, 'error', 5000));
  }
};

export const removeMovie = movieId => async dispatch => {
  try {
    // const token = localStorage.getItem('jwtToken');
    // const url = '/movies/' + movieId;
    // const response = await fetch(url, {
    //   method: 'DELETE',
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //     'Content-Type': 'application/json'
    //   }
    // });
    const doc = deleteDoc(doc(db,'moives',movieId));

    if (doc) {
      dispatch(getMovies());
      dispatch(onSelectMovie(null));
      dispatch(setAlert('Movie have been Deleted!', 'success', 5000));
    }
  } catch (error) {
    dispatch(setAlert(error.message, 'error', 5000));
  }
};
