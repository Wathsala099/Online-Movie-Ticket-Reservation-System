import { auth } from '../firebase/authConfig';
import { onAuthStateChanged  } from '@firebase/auth';


export const isBrowser = () => typeof window !== 'undefined';
export const getUser = () =>
  isBrowser() && window.localStorage.getItem('user')
    ? JSON.parse(window.localStorage.getItem('user'))
    : {};

export const setUser = user =>{
  window.localStorage.setItem('user', JSON.stringify(user));}
export const removeUser = () => window.localStorage.removeItem('user');
export const isLoggedIn = () => {
  // onAuthStateChanged(auth, (user) => {
  //   if (user) {
  //     return user;
  //   } else {
  //     return null;
  //   }
  // });
  const user = getUser();
  return !!user.username;
};
