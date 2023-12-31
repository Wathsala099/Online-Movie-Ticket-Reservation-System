import {
  TOGGLE_DIALOG,
  SELECT_SHOWTIMES,
  SELECT_ALL_SHOWTIMES,
  GET_SHOWTIMES,
  DELETE_SHOWTIME
} from '../types';
import { setAlert } from './alert';
import { convertDate } from '../../utils';
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

export const toggleDialog = () => ({ type: TOGGLE_DIALOG });

export const selectShowtime = showtime => ({
  type: SELECT_SHOWTIMES,
  payload: showtime
});

export const selectAllShowtimes = () => ({ type: SELECT_ALL_SHOWTIMES });

export const getShowtimes = () => async dispatch => {
  try {
    // const token = localStorage.getItem('jwtToken');
    // const url = '/showtimes';
    // const response = await fetch(url, {
    //   method: 'GET',
    //   headers: {
    //     Authorization: `Bearer ${token}`
    //   }
    // });
    // const showtimes = await response.json();
    // if (response.ok) {
    //   dispatch({ type: GET_SHOWTIMES, payload: showtimes });
    // }
    const querySnapshot = await getDocs(collection(db, 'showtimes'));
    const showtime = new Array(querySnapshot.size);
    querySnapshot.forEach(q => {
      showtime.fill({
        _id: q.data()._id,

        cinemaId: q.data().cinemaId,

        endDate: convertDate( q.data().endDate),

        movieId: q.data().movieId,

        startAt: q.data().startAt,

        startDate: convertDate(q.data().startDate)
      });
    });
    dispatch({ type: GET_SHOWTIMES, payload: showtime });
  } catch (error) {
    dispatch(setAlert(error.message, 'error', 5000));
  }
};

export const addShowtime = showtime => async dispatch => {
  try {
    // const token = localStorage.getItem('jwtToken');
    // const url = '/showtimes/';
    // const response = await fetch(url, {
    //   method: 'POST',
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(showtime)
    // });
    // if (response.ok) {
    //   dispatch(setAlert('Showtime Created', 'success', 5000));
    //   return { status: 'success', message: 'Showtime Created' };
    // }
    const docRef = await addDoc(collection(db, 'showtimes'), showtime);
    if (docRef) {
      const showtimeDoc = doc(db, 'showtimes', docRef.id);
      await updateDoc(showtimeDoc, {
        _id: docRef.id
      });
      dispatch(setAlert('Showtime Created', 'success', 5000));
      return { status: 'success', message: 'Showtime Created' };
    }
  } catch (error) {
    dispatch(setAlert(error.message, 'error', 5000));
    return {
      status: 'error',
      message: ' Cinema have not been saved, try again.'
    };
  }
};

export const updateShowtime = (showtime, id) => async dispatch => {
  try {
    const token = localStorage.getItem('jwtToken');
    const url = '/showtimes/' + id;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(showtime)
    });
    if (response.ok) {
      dispatch(setAlert('Showtime Created', 'success', 5000));
      return { status: 'success', message: 'Showtime Created' };
    }
  } catch (error) {
    dispatch(setAlert(error.message, 'error', 5000));
    return {
      status: 'error',
      message: ' Cinema have not been saved, try again.'
    };
  }
};

export const deleteShowtime = id => async dispatch => {
  try {
    const token = localStorage.getItem('jwtToken');
    const url = '/showtimes/' + id;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.ok) {
      dispatch({ type: DELETE_SHOWTIME, payload: id });
      dispatch(setAlert('Showtime Deleted', 'success', 5000));
      dispatch(getShowtimes());
      return { status: 'success', message: 'Showtime Removed' };
    }
  } catch (error) {
    dispatch(setAlert(error.message, 'error', 5000));
    return {
      status: 'error',
      message: ' Showtime have not been deleted, try again.'
    };
  }
};
