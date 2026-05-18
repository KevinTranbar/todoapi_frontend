import { register as registerApi, login as loginApi } from '../../Api/auths';
import { useState } from 'react';
import { useAuth } from '../../Context/authContext';
import styles from './authentication.module.css';

function Authentication() {

    const { login } = useAuth(); //Object destructuring = Take out login function from auth context using useAuth hook
    const [isLoggedIn, setIsLoggedIn] = useState(true); //State to toggle between login and register forms (Default to login form)
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}); //State to hold field-specific validation errors from API (notNull, size, etc.))
    const [loading, setLoading] = useState(false); //State to indicate whether API request is in progress (Used to disable buttons and show loading state)

    async function handleSubmit() {
        setError(null); //Clear previous error messages
        setFieldErrors({}); //Clear previous field errors
        setLoading(true);

        try { //Try to login or register
            const response = isLoggedIn
                ? await loginApi(username, password) //Call login API if isLoggedIn is true
                : await registerApi(username, password); //Call register API if isLoggedIn is false
            //Take out token from response object
            login(response.token, response.refreshToken); //Store token and username in context and local storage, and re-render components with updated auth state 
        } catch (err: any) { //Catch errors
            if (err.errors) { //If field erros, set field errors, otherwise set general error message
                setFieldErrors(err.errors); //Set field-specific validation errors from API response
            } else {
                setError(err.message || 'Something went wrong');
            }
        } finally { //End loading state after API call is done (Whether successful or error)
            setLoading(false);
        }
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>
                {isLoggedIn ? 'Login' : 'Register'}
            </h2>

            {// show general error message if exists
                error && <p className={styles.error}>{error}</p>
            }

            <div className={styles.form}>
                <input
                    className={styles.input}
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                        if (fieldErrors.username) {
                            setFieldErrors(prev => { //Clear username field error when user starts typing in username input
                                const next = { ...prev };
                                delete next.username;
                                return next;
                            });
                        }
                    }}
                />
                {fieldErrors.username && ( //Only show field error if there is one
                    <span className={styles.fieldError}>{fieldErrors.username}</span>
                )}

                <input
                    className={styles.input}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) {
                            setFieldErrors(prev => { //Clear password field error when user starts typing in password input
                                const next = { ...prev };
                                delete next.password;
                                return next;
                            });
                        }
                    }}
                />
                {fieldErrors.password && ( //Only show field error if there is one
                    <span className={styles.fieldError}>{fieldErrors.password}</span>
                )}

                <button
                    className={styles.btnSubmit}
                    onClick={handleSubmit}
                    disabled={loading} //If loading true, disable button to prevent multiple submissions
                >
                    { //If loading, show 'Loading...' on button, otherwise show 'Login' or 'Register' based on isLoggedIn state
                        loading ? 'Loading...' : (isLoggedIn ? 'Login' : 'Register')
                    }
                </button>

                <button //Button to toggle between login and register forms. Clears error messages and field errors when toggling.
                    className={styles.btnSwitch}
                    onClick={() => {
                        setIsLoggedIn(!isLoggedIn);
                        setError(null);
                        setFieldErrors({});
                    }}
                >
                    {isLoggedIn ? 'No account? Register' : 'Have an account? Login'}
                </button>
            </div>
        </div>
    );
}

export default Authentication;