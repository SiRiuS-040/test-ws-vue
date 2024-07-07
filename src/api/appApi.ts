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

export enum CALL_PATH {
  LOGIN = 'http://enter.local/login',
  LOGIN_BY_TOKEN = 'http://enter.local/loginByToken',
  LOGOUT = 'http://enter.local/logout',
  SUBSCRIBE_LIST = 'http://enter.local/subscription/logs/list',
  SUBSCRIBE = `http://enter.local/`,
  UNSUBSCRIBE = `http://enter.local/`,
  HEART_BEAT = ''
}

export enum CALL_TYPE {
  LOGIN = 2,
  LOGIN_BY_TOKEN = 2,
  LOGOUT = 2,
  SUBSCRIBE_LIST = 5,
  SUBSCRIBE = 5,
  UNSUBSCRIBE = 6,
  HEART_BEAT = 20
}

export enum CALL_MSG_TYPE {
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
  EVENT = 'EVENT'
}

export class AppApi {
  login(connection: WebSocket, loginData: LoginData) {
    const args = [CALL_TYPE.LOGIN, generateId(16), CALL_PATH.LOGIN, loginData]

    addResponseMessage(CALL_MSG_TYPE.LOGIN, args)
    connection.send(JSON.stringify(args))
  }

  loginByToken(connection: WebSocket) {
    let token: string | null = tokenInput.value

    if (!tokenInput.value && localStorage.getItem('Token')) {
      token = localStorage.getItem('Token')
    }

    const args = [CALL_TYPE.LOGIN_BY_TOKEN, generateId(16), CALL_PATH.LOGIN_BY_TOKEN, token]

    addResponseMessage(CALL_MSG_TYPE.LOGIN_BY_TOKEN, args)
    connection.send(JSON.stringify(args))
  }

  logout(connection: WebSocket) {
    const args = [CALL_TYPE.LOGOUT, generateId(16), CALL_PATH.LOGOUT]

    addResponseMessage(CALL_MSG_TYPE.LOGOUT, args)
    connection.send(JSON.stringify(args))
  }

  subscribeList(connection: WebSocket) {
    const args = [CALL_TYPE.SUBSCRIBE_LIST, CALL_PATH.SUBSCRIBE_LIST]

    addResponseMessage(CALL_MSG_TYPE.SUBSCRIBE_LIST, args)
    connection.send(JSON.stringify(args))
  }

  subscribe(connection: WebSocket, subscription: string) {
    const args = [CALL_TYPE.SUBSCRIBE, `${CALL_PATH.SUBSCRIBE}${subscription}`]

    addResponseMessage(CALL_MSG_TYPE.SUBSCRIBE, args)
    connection.send(JSON.stringify(args))
  }

  unsubscribe(connection: WebSocket, subscription: string) {
    const args = [CALL_TYPE.UNSUBSCRIBE, `${CALL_PATH.SUBSCRIBE}${subscription}`]

    addResponseMessage(CALL_MSG_TYPE.UNSUBSCRIBE, args)
    connection.send(JSON.stringify(args))
  }

  sendHeartBeat(connection: WebSocket, counter: number) {
    const args = [CALL_TYPE.HEART_BEAT, counter]

    addResponseMessage(CALL_MSG_TYPE.HEART_BEAT, args)
    connection.send(JSON.stringify(args))
  }
}
