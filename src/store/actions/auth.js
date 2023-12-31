import {
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT
} from '../types';
import { setAlert } from './alert';
import { setAuthHeaders, setUser, removeUser, isLoggedIn } from '../../utils';
import { auth, googleAuth } from '../../firebase/authConfig';
import {
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from '@firebase/auth';
import { storage, db } from '../../firebase/dbConfig';
import {
  getDownloadURL,
  ref,
  uploadBytes,
  uploadBytesResumable
} from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export const uploadImage = (id, image) => async dispatch => {
  try {
    // const data = new FormData();
    // data.append('file', image);
    // const url = '/users/photo/' + id;
    // const response = await fetch(url, {
    //   method: 'POST',
    //   body: data
    // });
    // const responseData = await response.json();
    const imageRef = ref(storage, `userImages/${image.name + id}`);
    const upload = uploadBytes(imageRef, image);
    if (upload) {
      dispatch(setAlert('Image Uploaded', 'success', 5000));
    }
    // if (responseData.error) {
    //   dispatch(setAlert(responseData.error.message, 'error', 5000));
    // }
  } catch (error) {
    dispatch(setAlert(error.message, 'error', 5000));
  }
};

// Login user
export const login = (email, password) => async dispatch => {
  try {
    //   const url = '/users/login';
    //   const response = await fetch(url, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ email, password })
    //   });
    //   const responseData = await response.json();
    const result = await signInWithEmailAndPassword(auth, email, password);

    if (result) {
      const user = result.user;
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      console.log(user);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        user && setUser(userData);
        dispatch({ type: LOGIN_SUCCESS, payload: userData });
        dispatch(setAlert(`Welcome ${user.displayname}`, 'success', 5000));
      } else {
        // doc.data() will be undefined in this case
        console.log('No such document!');
      }
    }
    // if (responseData.error) {
    //   dispatch({ type: LOGIN_FAIL });
    //   dispatch(setAlert(responseData.error.message, 'error', 5000));
    // }
  } catch (error) {
    dispatch({ type: LOGIN_FAIL });
    dispatch(setAlert(error.message, 'error', 5000));
  }
};

export const facebookLogin = e => async dispatch => {
  try {
    const { email, userID, name } = e;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userID, name })
    };
    const url = '/users/login/facebook';
    const response = await fetch(url, options);
    const responseData = await response.json();

    if (response.ok) {
      const { user } = responseData;
      user && setUser(user);
      dispatch({ type: LOGIN_SUCCESS, payload: responseData });
      dispatch(setAlert(`Welcome ${user.name}`, 'success', 5000));
    }
    if (responseData.error) {
      dispatch({ type: LOGIN_FAIL });
      dispatch(setAlert(responseData.error.message, 'error', 5000));
    }
  } catch (error) {
    dispatch({ type: LOGIN_FAIL });
    dispatch(setAlert(error.message, 'error', 5000));
  }
};

export const googleLogin = ({ profileObj }) => async dispatch => {
  try {
    // const { email, googleId, name } = profileObj;
    const result = await signInWithPopup(auth, googleAuth);
    // const options = {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, googleId, name })
    // };
    // const url = '/users/login/google';
    // const response = await fetch(url, options);
    // const responseData = await response.json();

    if (result) {
      const user = result.user;
      user && setUser(user);
      dispatch({ type: LOGIN_SUCCESS, payload: result });
      dispatch(setAlert(`Welcome ${user.displayName}`, 'success', 5000));
    }
    // if (responseData.error) {
    //   dispatch({ type: LOGIN_FAIL });
    //   dispatch(setAlert(responseData.error.message, 'error', 5000));
    // }
  } catch (error) {
    dispatch({ type: LOGIN_FAIL });
    dispatch(setAlert(error.message, 'error', 5000));
  }
};

// Register user
export const register = ({
  name,
  username,
  email,
  phone,
  image,
  password
}) => async dispatch => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (result) {
      const user = result.user;

      console.log(user);
      let url = '';
      if (image) {
        const imageRef = ref(storage, `userImages/${image.name + user.uid}`);
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
            console.log(error);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then(async downloadURL => {
              console.log('File available at', downloadURL);
              const docRef = await setDoc(doc(db, 'users', user.uid), {
                name: name,
                username: username,
                email: email,
                phone: phone,
                image: downloadURL,
                role: 'guest'
              });

              user && setUser(user);

              dispatch({ type: REGISTER_SUCCESS, payload: docRef });
              dispatch(setAlert('Register Success', 'success', 5000));
            });
          }
        );
        {
          // uploadBytes(imageRef, image)
          // .then(async () => {
          //   dispatch(setAlert('Image Uploaded', 'success', 5000));
          //   url = await getDownloadURL(imageRef);
          // })
          // .catch(error => {
          //   dispatch(setAlert(error.message, 'error', 5000));
          // });
        }
      }
    }
  } catch (error) {
    dispatch({ type: REGISTER_FAIL });
    dispatch(setAlert(error.message, 'error', 5000));
  }
};

// Load user
export const loadUser = () => async dispatch => {
  // if (!isLoggedIn()) return;
  try {
    
    onAuthStateChanged(auth, async user => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          user && setUser(userData);
          dispatch({ type: USER_LOADED, payload: userData });
        } else {
          // doc.data() will be undefined in this case
          console.log('No such document!');
        }
      } else {
        console.log('no user');
      }
      if (!user) dispatch({ type: AUTH_ERROR });
    });
    // const currUser = auth.currentUser;
    // if (currUser) {

    //   const user = currUser;
    //   user && setUser(user);
    //   dispatch({ type: USER_LOADED, payload: currUser });
    // }
    // if (!currUser) dispatch({ type: AUTH_ERROR });
  } catch (error) {
    dispatch({ type: AUTH_ERROR });
  }
};

// Logout
export const logout = () => async dispatch => {
  try {
    // const token = localStorage.getItem('jwtToken');
    // const url = '/users/logout';
    // const response = await fetch(url, {
    //   method: 'POST',
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //     'Content-Type': 'application/json'
    //   }
    // });
    // const responseData = await response.json();
    const result = signOut(auth);
    if (result) {
      removeUser();
      dispatch({ type: LOGOUT });
      dispatch(setAlert('LOGOUT Success', 'success', 5000));
    }
    // if (responseData.error) {
    //   dispatch(setAlert(responseData.error.message, 'error', 5000));
    // }
  } catch (error) {
    dispatch(setAlert(error.message, 'error', 5000));
  }
};
