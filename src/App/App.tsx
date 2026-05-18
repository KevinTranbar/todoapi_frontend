import TodoList from '../Components/TodoList/todoList';
import Authentication from '../Components/Authentication/authentication';
import { useAuth } from '../Context/authContext';
import styles from './App.module.css';
import { logout as logoutApi } from "../Api/auths"

function App() {
  const { isAuthenticated, username, logout } = useAuth(); //Get isAuthenticated value from auth context using useAuth hook

  async function handleLogout() {
    try {
      await logoutApi();
    } catch {
      //Intentionally ignored - logout locally regardless of backend failure
      //Tradeoff: Stale refresh token in backend (expieres naturally after 7 days)
    }

    logout(); //Clears localstorage + state
  }

  if (!isAuthenticated) { //If user is not authenticated, show authentication component (Login/Register forms), otherwise render TodoList component
    return <Authentication />;
  }

  return (
    <div>
      <div className={styles.header}>
        <span className={styles.welcome}>Welcome, {username}</span>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
      <TodoList />
    </div>
  )
}

export default App
