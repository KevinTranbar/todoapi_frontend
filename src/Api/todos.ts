import type { Todo, TodoRequest, PageResponse } from '../Types/todo';
import { refreshToken } from './auths';

const API_BASE_URL = 'http://localhost:8080/api/todos';

let isRefreshing = false; //Flag to prevent multiple simultaneous token refreshes
let retryQueue: Array<{ //Why need queue? = Stopps multiple failed API calls from attemting refresh process at same time --> would lead to forcelogout even though first refresh attempt succeeded
    resolve: () => void;
    reject: () => void;
}> = []; //Queue to hold API calls that fail during token refresh
//retryQueue holds pre-saved resolve / reject methods for each stopped API call
//resolve = represents the refresh success path (retry original API call with new token)
//reject = fail the suspended Promise (failiure path)
//processQueue activates one of the two for each stopped call depending on if refresh attempt failed or succeeded
//retryQueue doesn't hold the actual promises. The promises are just the suspended API calls, waiting for processQueue to activate the promise's resolve or reject method

//Flow:
//1. Wrap every API req in 401 check
//2. Send API req --> if 401, check if problem being resolved (isRefreshing = true)
//3. If isRefreshing = true --> pre-save resolve/reject methods in retryQueue --> return new Promise to caller (suspends caller)
//4. First 401 starts refresh --> isRefreshing = true --> updates localStorage with new tokens
//5. When refresh done --> processQueue fires
//6. processQueue --> activates pre-saved methods in retryQueue --> retry API reqs --> callers get responses

//How does value from processQueue's reject or resolve, find its way back to rightful promise?
//Pre-saved method from each promise in wait in retryQueue are connected to respecitve promise
//Basically = The method in the queue holds a direct reference to the Promise's resolve via closure --> calling the method automatically feeds the value back into the Promise (When method called, value redirected to promise)

//Queue summerised:
//Stop — a refresh attempt is ongoing
//Wait here until refresh finishes (suspended Promise = "you will get a value eventually")
//In the meantime, we'll save your order (resolve/reject methods) in retryQueue
//When refresh finishes, we'll have processQueue activates your saved methods
//resolve = retry your original API call → get response → return value to your caller
//reject  = fail your Promise → return error to your caller

function buildAuthHeaders(): HeadersInit { //HeadersInit type for fetch headers
    const token = localStorage.getItem('token'); //Get token from local storage (Assuming token is stored there after login)
    return {
        'Content-Type': 'application/json', //Default return
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}) //Also return auth header if token exists (Spread operator to add onto existing headers)
    };
}

function processQueue(error: unknown) { //Helper function to process the retryQueue after token refresh attemt finishes
    retryQueue.forEach(prom => { //Loops through retryQueue to either call the resolve methods of waiting promises or reject methods of waiting promises
        if (error) {
            prom.reject(); //If refresh failed and error was returned, call reject methods for all waiting promises
        } else {
            prom.resolve(); //If refresh successful and no error, call resolve methods for all waiting promises
        }
    });
    retryQueue = []; //Clear the queue after processing
}

async function apiFetch(url: string, options?: RequestInit): Promise<Response> { //RequestInit type for fetch options
    const res = await fetch(url, {
        ...options, //Spread any options passed in with the function call (Eg. method, body, etc.)
        headers: {
            ...buildAuthHeaders(), //Spread auth headers into request header
            ...options?.headers //Spread any extra headers from options
        }
    });

    if (res.status === 401) { //If fetch returns unauthorized = Token invalid or expired
        const storedRefreshToken = localStorage.getItem('refreshToken'); //Get refresh token from local storage

        if (!storedRefreshToken) { //If no refresh token in local storage, force logout since user can't get more access tokens without valid refresh token
            forceLogout();
            throw new Error('Unauthorized');
        }

        if (isRefreshing) { //If refresh process ongoing, suspend API calls and pre-save their resolve / reject methods to get called by processQueue
            return new Promise((promResolve, promReject) => { //Creates promise for caller (one that called API which got put in queue)  //Basically suspends API call ("You will get a value back eventually")
                retryQueue.push({ //Save resolve and reject methods for this promise in the queue so they can be called in processQueue after refresh attempt finishes
                    resolve: () => promResolve(apiFetch(url, options)), //Resolve method for this promise means to resolve promise (promResolve) by doing apiFetch(url, options) (retrying original call)
                    reject: promReject //Reject method for this promise means to reject promise (promReject)
                });
            });
        }

        isRefreshing = true;

        try { //Attemt refresh 
            const response = await refreshToken(); //Try to refreshToken, returns object with accesstoken and refreshtoken
            const newToken = response.token //Extract tokens from returned object from backend
            const newRefreshToken = response.refreshToken

            localStorage.setItem("token", newToken); //Set new tokens in local storage
            localStorage.setItem("refreshToken", newRefreshToken);

            processQueue(null); //Activate processQueue method with null as error arg = if statement goes next //Wake up waiting promises and start retrying

            return apiFetch(url, options); //Retry original request with NEW valid token (now in localStorage) //Initial req not in queue so need to retry seperately
        } catch (refreshError) { //If any error when attemting to refresh token --> Reject all waiting promises and force logout
            processQueue(refreshError);
            forceLogout();
            throw new Error("Session expired");
        } finally { //Set isRefreshing = false regardless of result
            isRefreshing = false;
        }
    }

    return res; //If okay and not 401, return response
}

function forceLogout() { //Helper function to clear local storage and reload page on 401 errors (refresh token expired or invalid)
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    window.location.reload();
}

export async function fetchTodos(
    pageNum = 0, //Default to first page aka no pagination
    pageSize = 20, //Default page size
    completed?: boolean,
    sort = 'createdAt,desc'
): Promise<PageResponse<Todo>> {
    const params = new URLSearchParams({ //Build query parameters for pagination and filtering
        page: String(pageNum),
        size: String(pageSize),
    });
    if (completed !== undefined) params.append('completed', String(completed));
    if (sort) params.append('sort', sort);

    const res = await apiFetch(`${API_BASE_URL}?${params.toString()}`); //Use apiFetch to include auth headers and handle 401 errors
    if (!res.ok) throw await res.json();
    return res.json();
}

export async function fetchTodoById(id: number): Promise<Todo> {
    const res = await apiFetch(`${API_BASE_URL}/${id}`);
    if (!res.ok) throw await res.json();
    return res.json();
}

export async function createTodo(data: TodoRequest): Promise<Todo> {
    const res = await apiFetch(API_BASE_URL, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    if (!res.ok) throw await res.json();
    return res.json();
}

export async function updateTodo(id: number, data: TodoRequest): Promise<Todo> {
    const res = await apiFetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    if (!res.ok) throw await res.json();
    return res.json();
}

export async function deleteTodo(id: number): Promise<void> {
    const res = await apiFetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw await res.json();
}