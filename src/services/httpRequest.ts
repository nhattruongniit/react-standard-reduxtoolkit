import axios, { AxiosError } from 'axios';

const config = {
  baseURL: 'http://localhost:3002/api',
  timeout: 10000,
}

const { CancelToken } = axios;
let cancel: any = null;

export const httpRequest = axios.create(config);

httpRequest.interceptors.request.use(
  (config) => {
    // cancel token
    if (cancel) {
      cancel(); // cancel request
    }
    config.cancelToken = new CancelToken(function executor(c) {
      cancel = c;
    });

    // add x-auth-token
    const accessToken = window.localStorage.getItem('access_token');;
    if (accessToken) {
      config.headers['x-auth-token'] = accessToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

httpRequest.interceptors.response.use(
  (res: any) => {
    return res;
  },
  async (error: AxiosError) => {

    // handle request timeout
    if (error.code === 'ECONNABORTED') {
      console.log('request timeout');
    }

    // access token expired
    if(error?.response?.status === 401) {
      try {
        const result = await httpRequest.post("/user/refresh-token", {
          data: {
            refresh_token: window.localStorage.getItem("refresh_token"),
          }
        });
        console.log('result: ', result)
        window.localStorage.setItem("access_token", result.data.data.access_token);
        httpRequest.defaults.headers.common["x-auth-token"] =  result.data.data.access_token; 

        return httpRequest(error?.config as any);
      } catch (err: any) {
        if (err?.response && err.response.data) {
          return Promise.reject(err.response.data);
        }
        return Promise.reject(err);
      }
    }

    // handle errors
    switch (error.response?.status) {
      case 400: {
        break;
      }
      case 500: {
        break;
      }
      default:
        break;
    }
    return Promise.reject(error);
  },
);