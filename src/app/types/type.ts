export interface LoginData {
  username: string
  password: string
}

export interface LoginCall {
  Token: string
  Username: string
}

export interface LogItem {
  Timestamp: string
  Level: string
  Message: string
  Source: string
}

export interface SubscribeCall {
  Action: number
  Items: LogItem[]
}

export interface CmdLogItem {
  date: string
  type: string
  msg: any[]
}

export enum MSG_TYPE {
  WELCOME = 0,
  CALL = 2,
  CALL_RESULT = 3,
  CALL_ERROR = 4,
  SUBSCRIBE = 5,
  UNSUBSCRIBE = 6,
  EVENT = 8,
  HEART_BEAT = 20
}

export enum CALL_TYPE {
  LOGIN = MSG_TYPE.CALL,
  LOGIN_BY_TOKEN = MSG_TYPE.CALL,
  LOGOUT = MSG_TYPE.CALL,
  SUBSCRIBE_LIST = MSG_TYPE.SUBSCRIBE,
  SUBSCRIBE = MSG_TYPE.SUBSCRIBE,
  UNSUBSCRIBE = MSG_TYPE.UNSUBSCRIBE,
  HEART_BEAT = MSG_TYPE.HEART_BEAT
}

export enum CALL_PATH {
  LOGIN = 'http://enter.local/login',
  LOGIN_BY_TOKEN = 'http://enter.local/loginByToken',
  LOGOUT = 'http://enter.local/logout',
  SUBSCRIBE_LIST = 'http://enter.local/subscription/logs/list',
  SUBSCRIBE = `http://enter.local/`,
  UNSUBSCRIBE = `http://enter.local/`
}

export enum CALL_MSG_LABEL {
  LOGIN = 'LOGIN CALL',
  LOGIN_BY_TOKEN = 'LOGIN_BY_TOKEN CALL',
  LOGOUT = 'LOGOUT CALL',
  SUBSCRIBE_LIST = 'SUBSCRIBE_LIST CALL',
  SUBSCRIBE = 'SUBSCRIBE CALL',
  UNSUBSCRIBE = 'UNSUBSCRIBE CALL',
  HEART_BEAT = 'HEART_BEAT CALL'
}

export enum RESPONSE_MSG_TYPE {
  OPEN_CONNECTION = 'OPEN_CONNECTION',
  DISCONNECTED_BY_USER = 'DISCONNECTED_BY_USER',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RESPONSE_ERROR = 'RESPONSE_ERROR',
  RESPONSE = 'RESPONSE',
  EVENT = 'EVENT RESPONSE',
  CALL_ERROR = 'CALL_ERROR',
  HEART_BEAT = 'HEART_BEAT RESPONSE'
}
