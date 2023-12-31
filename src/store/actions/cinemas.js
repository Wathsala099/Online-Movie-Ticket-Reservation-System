import { GET_CINEMAS, GET_CINEMA } from '../types';
import { setAlert } from './alert';
import { storage, db } from '../../firebase/dbConfig';
import {
  doc,
  addDoc,
  setDoc,
  updateDoc,
  getDocs,
  getDoc,
  collection
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';


const makeArray = (datas) =>{
  const arr = new Array(datas.size);
  datas.forEach(data=>{
    arr.push(data);
  })
  return arr;
}

export const uploadCinemaImage = (id, image) => async dispatch => {
  try {
    //   const data = new FormData();
    //   data.append('file', image);
    //   const url = '/cinemas/photo/' + id;
    //   const response = await fetch(url, {
    //     method: 'POST',
    //     body: data
    //   });
    //   const responseData = await response.json();
    //   if (response.ok) {
    //     dispatch(setAlert('Image Uploaded', 'success', 5000));
    //   }
    //   if (responseData.error) {
    //     dispatch(setAlert(responseData.error.message, 'error', 5000));
    //   }
    const imageRef = ref(storage, `cinemaImages/${image.name + id}`);
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
          const cinemaDocRef = doc(db, 'cinemas', id);
          await updateDoc(cinemaDocRef, {
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

export const getCinemas = () => async dispatch => {
  try {
    // const url = '/cinemas';
    // const response = await fetch(url, {
    //   method: 'GET',
    //   headers: { 'Content-Type': 'application/json' }
    // });
    // const cinemas = await response.json();
    // if (response.ok) {
    //   dispatch({ type: GET_CINEMAS, payload: cinemas });
    // }

    const querySnapshot = await getDocs(collection(db, 'cinemas'));

    // var cinemas = [];
    var cinemas = new Array(querySnapshot.size);

    // var seats = {};
    querySnapshot.forEach(async (document, i) => {
      // doc.data() is never undefined for query doc snapshots
      var cinemaDetail = document.data();
     
      const seatSnap = await getDoc(doc(db, 'seats', document.id));
      var seat = seatSnap.data();
      // var cinemaFullDetail = {...cinemaFullDetail,...cinemaDetail,seats:seat}
      cinemaDetail = { ...cinemaDetail, seats: seat };
      console.log(cinemaDetail);
      cinemas.fill(cinemaDetail);
      // console.log(document.id, ' => ', document.data());
    });
    console.log(cinemas);
    dispatch({ type: GET_CINEMAS, payload: cinemas });
  } catch (error) {
    dispatch(setAlert(error.message, 'error', 5000));
  }
};

export const getCinema = id => async dispatch => {
  try {
    // const url = '/cinemas/' + id;
    // const response = await fetch(url, {
    //   method: 'GET',
    //   headers: { 'Content-Type': 'application/json' }
    // });
    // const cinema = await response.json();
    // if (response.ok) {
    //   dispatch({ type: GET_CINEMA, payload: cinema });
    // }
    const docRef = doc(db, 'cinemas', id);
    const docSnap = await getDoc(docRef);
    
    
    if (docSnap.exists()) {
      var cinemaDetail = docSnap.data();
      const seatSnap = await getDoc(doc(db, 'seats', docSnap.id));
      var seat = makeArray(seatSnap.data());
      cinemaDetail = { ...cinemaDetail, seats: seat };
      // var cinemaFullDetail = { ...cinemaDetail, seats: seat };
      console.log(cinemaDetail);
      console.log('Document data:', docSnap.data());
      dispatch({ type: GET_CINEMA, payload: cinemaDetail });
    } else {
      // doc.data() will be undefined in this case
      console.log('No such document!');
    }
  } catch (error) {
    dispatch(setAlert(error.message, 'error', 5000));
  }
};

export const createCinemas = (image, newCinema) => async dispatch => {
  try {
    // const token = localStorage.getItem('jwtToken');
    // const url = '/cinemas';
    // const response = await fetch(url, {
    //   method: 'POST',
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(newCinema)
    // });
    // const cinema = await response.json();
    console.log(newCinema);
    const docRef = await addDoc(collection(db, 'cinemas'), {
      name: newCinema.name,
      ticketPrice: newCinema.ticketPrice,
      city: newCinema.city,
      seatsAvailable: newCinema.seatsAvailable,
      image: ''
    });
    if (newCinema.seats) {
      newCinema.seats.forEach(async (seat, i) => {
        await setDoc(doc(db, 'seats', docRef.id), {
          [i]: seat
        });
      });
    }
    const cinemaDocRef = doc(db, 'cinemas', docRef.id);
    await updateDoc(cinemaDocRef, {
      _id: docRef.id
    });

    if (cinemaDocRef) {
      dispatch(setAlert('Cinema Created', 'success', 5000));
      if (image) dispatch(uploadCinemaImage(docRef.id, image));
      dispatch(getCinemas());
      return { status: 'success', message: 'Cinema Created' };
    }
  } catch (error) {
    dispatch(setAlert(error.message, 'error', 5000));
    return {
      status: 'error',
      message: ' Cinema have not been saved, try again.'
    };
  }
};

export const updateCinemas = (image, cinema, id) => async dispatch => {
  try {
    // const token = localStorage.getItem('jwtToken');
    // const url = '/cinemas/' + id;
    // const response = await fetch(url, {
    //   method: 'PATCH',
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(cinema)
    // });
    // if (response.ok) {
    //   dispatch(setAlert('Cinema Updated', 'success', 5000));
    //   if (image) dispatch(uploadCinemaImage(id, image));
    //   return { status: 'success', message: 'Cinema Updated' };
    // }
    const docRef = doc(db, 'cinemas', id);
    await updateDoc(docRef, {
      name: cinema.name,
      ticketPrice: cinema.ticketPrice,
      city: cinema.city,
      seatsAvailable: cinema.seatsAvailable,
      image: ''
    });
    if (cinema.seats) {
      cinema.seats.forEach(async (seat, i) => {
        await updateDoc(doc(db, 'seats', id), {
          [i]: seat
        });
      });
    }

    dispatch(setAlert('Cinema Updated', 'success', 5000));
    if (image) dispatch(uploadCinemaImage(id, image));
    return { status: 'success', message: 'Cinema Updated' };
  } catch (error) {
    dispatch(setAlert(error.message, 'error', 5000));
    return {
      status: 'error',
      message: ' Cinema have not been updated, try again.'
    };
  }
};

export const removeCinemas = id => async dispatch => {
  try {
    const token = localStorage.getItem('jwtToken');
    const url = '/cinemas/' + id;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.ok) {
      dispatch(setAlert('Cinema Deleted', 'success', 5000));
      return { status: 'success', message: 'Cinema Removed' };
    }
  } catch (error) {
    dispatch(setAlert(error.message, 'error', 5000));
    return {
      status: 'error',
      message: ' Cinema have not been deleted, try again.'
    };
  }
};

export const getCinemasUserModeling = username => async dispatch => {
  try {
    const url = '/cinemas/usermodeling/' + username;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const cinemas = await response.json();
    if (response.ok) {
      dispatch({ type: GET_CINEMAS, payload: cinemas });
    }
  } catch (error) {
    dispatch(setAlert(error.message, 'error', 5000));
  }
};
