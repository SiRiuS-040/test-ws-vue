<template>
  <div class="content admin-panel">
    <div class="content__wrapper">
      <div class="admin-panel__status">
        <span :class="statusClass" class="status-marker"></span>
        <span v-if="isConnected">WS Connected</span>

        <span v-if="isConnected && isAuthorized">Name: {{ USER_NAME }}</span>
      </div>

      <button v-if="isConnected" class="ui-button" @click="connection.close()">
        Закрыть соединение
      </button>
      <button v-if="!isConnected" class="ui-button" @click="openConnection()">
        Повторное соединение
      </button>

      <button class="ui-button" @click="isCmdLogPanelHidden = !isCmdLogPanelHidden">
        Скрыть / показать панель логов команд
      </button>

      <button class="ui-button" @click="clearCmdLogs()">Очитить логи команд</button>

      <h2>Блок панели управления</h2>

      <div v-if="!isAuthorized && isConnected" class="admin-panel__login-form login-form">
        <input v-model="username" type="text" />
        <input v-model="password" type="text" />
        <button class="ui-button" @click="api.login(connection, loginData)">Log in</button>
        <p>Вход по своему токену</p>

        <label class="ui-input">
          <span class="ui-input__label">Свой токен</span>
          <input
            v-model="tokenInput"
            type="text"
            placeholder="type your token"
            class="ui-input__input"
          />
        </label>

        <button class="ui-button" @click="api.loginByToken(connection)">Log by token</button>
      </div>

      <div v-if="isAuthorized" class="admin-panel__controls">
        <button class="ui-button" @click="api.logout(connection)">Log out</button>
        <button class="ui-button" @click="api.subscribeList(connection)">Получить логи</button>

        <hr />
        <label class="ui-input">
          <span class="ui-input__label">Подписка</span>
          <input
            v-model="subscribtionInput"
            type="text"
            placeholder="Подписка"
            class="ui-input__input"
          />
        </label>

        <button class="ui-button" @click="api.subscribe(connection, subscribtionInput)">
          Оформить подписку
        </button>

        <button class="ui-button" @click="api.unsubscribe(connection, subscribtionInput)">
          Отписаться
        </button>
        <hr />
      </div>
    </div>
    <div class="log-panel">
      <div :class="cmdLogPanelClass" class="admin-panel__logs-wrapper admin-panel__cmd-logs">
        <h2>Блок логов команд</h2>
        <div v-if="LOG_MSGS" class="logs-block" ref="cmdLogsList">
          <p v-for="(log, index) in LOG_MSGS" :key="index">
            {{ log }}
          </p>
        </div>
      </div>
      <div class="admin-panel__logs-wrapper admin-panel__journal-logs">
        <h2>Журнал работы</h2>
        <div class="logs-block" ref="journalLogsList">
          <p v-for="(log, index) in SUBSCRIBE_LOGS" :key="index" class="admin-panel__log-item">
            {{ `${log?.Timestamp} ${log?.Level} ${log?.Message} ${log?.Source}` }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, unref, reactive, computed, watch, nextTick } from 'vue'

// import {
//   AppApi,
//   LoginData,
//   LoginCall,
//   LogItem,
//   SubscribeCall,
//   CALL_PATH,
//   CALL_TYPE,
//   CALL_MSG_TYPE,
//   RESPONSE_MSG_TYPE
// } from '@/app/api/appApi'

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

enum MSG_TYPE {
  WELCOME = 0,
  CALL = 2,
  CALL_RESULT = 3,
  CALL_ERROR = 4,
  SUBSCRIBE = 5,
  UNSUBSCRIBE = 6,
  EVENT = 8,
  HEART_BEAT = 20
}

enum CALL_TYPE {
  LOGIN = MSG_TYPE.CALL,
  LOGIN_BY_TOKEN = MSG_TYPE.CALL,
  LOGOUT = MSG_TYPE.CALL,
  SUBSCRIBE_LIST = MSG_TYPE.SUBSCRIBE,
  SUBSCRIBE = MSG_TYPE.SUBSCRIBE,
  UNSUBSCRIBE = MSG_TYPE.UNSUBSCRIBE,
  HEART_BEAT = MSG_TYPE.HEART_BEAT
}

enum CALL_PATH {
  LOGIN = 'http://enter.local/login',
  LOGIN_BY_TOKEN = 'http://enter.local/loginByToken',
  LOGOUT = 'http://enter.local/logout',
  SUBSCRIBE_LIST = 'http://enter.local/subscription/logs/list',
  SUBSCRIBE = `http://enter.local/`,
  UNSUBSCRIBE = `http://enter.local/`
}

enum CALL_MSG_LABEL {
  LOGIN = 'LOGIN CALL',
  LOGIN_BY_TOKEN = 'LOGIN_BY_TOKEN CALL',
  LOGOUT = 'LOGOUT CALL',
  SUBSCRIBE_LIST = 'SUBSCRIBE_LIST CALL',
  SUBSCRIBE = 'SUBSCRIBE CALL',
  UNSUBSCRIBE = 'UNSUBSCRIBE CALL',
  HEART_BEAT = 'HEART_BEAT CALL'
}

enum RESPONSE_MSG_TYPE {
  OPEN_CONNECTION = 'OPEN_CONNECTION',
  DISCONNECTED_BY_USER = 'DISCONNECTED_BY_USER',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RESPONSE_ERROR = 'RESPONSE_ERROR',
  RESPONSE = 'RESPONSE',
  EVENT = 'EVENT RESPONSE',
  CALL_ERROR = 'CALL_ERROR'
}

class AppApi {
  login(connection: WebSocket, loginData: LoginData) {
    const args = [CALL_TYPE.LOGIN, generateId(16), CALL_PATH.LOGIN, loginData]

    addResponseMessage(CALL_MSG_LABEL.LOGIN, args)
    connection.send(JSON.stringify(args))
  }

  loginByToken(connection: WebSocket) {
    let token: string | null = tokenInput.value

    if (!tokenInput.value && localStorage.getItem('Token')) {
      token = localStorage.getItem('Token')
    }

    const args = [CALL_TYPE.LOGIN_BY_TOKEN, generateId(16), CALL_PATH.LOGIN_BY_TOKEN, token]

    addResponseMessage(CALL_MSG_LABEL.LOGIN_BY_TOKEN, args)
    connection.send(JSON.stringify(args))
  }

  logout(connection: WebSocket) {
    const args = [CALL_TYPE.LOGOUT, generateId(16), CALL_PATH.LOGOUT]

    addResponseMessage(CALL_MSG_LABEL.LOGOUT, args)
    connection.send(JSON.stringify(args))
  }

  subscribeList(connection: WebSocket) {
    const args = [CALL_TYPE.SUBSCRIBE_LIST, CALL_PATH.SUBSCRIBE_LIST]

    addResponseMessage(CALL_MSG_LABEL.SUBSCRIBE_LIST, args)
    connection.send(JSON.stringify(args))
  }

  subscribe(connection: WebSocket, subscription: string) {
    const args = [CALL_TYPE.SUBSCRIBE, `${CALL_PATH.SUBSCRIBE}${subscription}`]

    addResponseMessage(CALL_MSG_LABEL.SUBSCRIBE, args)
    connection.send(JSON.stringify(args))
  }

  unsubscribe(connection: WebSocket, subscription: string) {
    const args = [CALL_TYPE.UNSUBSCRIBE, `${CALL_PATH.SUBSCRIBE}${subscription}`]

    addResponseMessage(CALL_MSG_LABEL.UNSUBSCRIBE, args)
    connection.send(JSON.stringify(args))
  }

  sendHeartBeat(connection: WebSocket, counter: number) {
    const args = [CALL_TYPE.HEART_BEAT, counter]

    addResponseMessage(CALL_MSG_LABEL.HEART_BEAT, args)
    connection.send(JSON.stringify(args))
  }
}

const api = new AppApi()
let counter = 0

const WS_URL = 'ws://test.enter-systems.ru/'
let connection = new WebSocket(WS_URL, ['wamp'])

const LOG_MSGS = ref([] as string[])
const SUBSCRIBE_LOGS = ref([] as string[])

const username = ref('enter')
const password = ref('A505a')
const tokenInput = ref('')
const subscribtionInput = ref('')

const cmdLogsList = ref(null)
const journalLogsList = ref(null)

const loginData = reactive({
  username,
  password
})

const isConnected = ref(false)
const isAuthorized = ref(false)
const isCmdLogPanelHidden = ref(false)

const USER_NAME = ref('')
const USER_TOKEN = ref('')

const statusClass = computed(() => {
  return isConnected.value ? 'connected' : ''
})

const cmdLogPanelClass = computed(() => {
  return isCmdLogPanelHidden.value ? 'hidden' : ''
})

function dec2hex(dec: number) {
  return dec.toString(16).padStart(2, '0')
}

function generateId(len: number) {
  var arr = new Uint8Array((len || 40) / 2)
  window.crypto.getRandomValues(arr)
  return Array.from(arr, dec2hex).join('')
}

function getLogMsg(type: string, changedData: string) {
  const date = new Date()
  return `${date.toLocaleString()} ${type} ${changedData}`
}

function addResponseMessage(type: string, msg: any) {
  LOG_MSGS.value.push(getLogMsg(type, JSON.stringify(msg)))
}

function setConnectionWatchers() {
  connection.onopen = function () {
    addResponseMessage(
      RESPONSE_MSG_TYPE.OPEN_CONNECTION,
      'Установка соединения c ws://test.enter-systems.ru/'
    )
    isConnected.value = true
  }

  let heartBeatInterval = setInterval(() => {
    api.sendHeartBeat(connection, counter++)
  }, 30000)

  connection.onclose = function (event) {
    if (event.wasClean) {
      addResponseMessage(RESPONSE_MSG_TYPE.DISCONNECTED_BY_USER, '')
    } else {
      addResponseMessage(RESPONSE_MSG_TYPE.NETWORK_ERROR, '')
    }

    clearInterval(heartBeatInterval)
    isConnected.value = false
    isAuthorized.value = false
    counter = 0
  }

  connection.onerror = function (error: any) {
    alert('Ошибка ' + error.message)
    addResponseMessage(RESPONSE_MSG_TYPE.RESPONSE_ERROR, 'Ошибка ' + error.message)
  }

  setMessageWatcher()
}

function setMessageWatcher() {
  connection.onmessage = function (event) {
    const msg = JSON.parse(event.data)

    if (msg[0] !== MSG_TYPE.EVENT && msg[0] !== MSG_TYPE.CALL_ERROR) {
      LOG_MSGS.value.push(getLogMsg(RESPONSE_MSG_TYPE.RESPONSE, JSON.stringify(msg)))
    }

    // 3 - CallResult
    if (msg[0] === MSG_TYPE.CALL_RESULT) {
      // Проверка на данные логина
      if (msg[2] && msg[2].Token && msg[2].Username) {
        localStorage.setItem('Token', msg[2].Token)
        USER_NAME.value = msg[2].Username
        isAuthorized.value = true
        USER_TOKEN.value = msg[2].Token
      }

      // Проверка на логаут
      if (msg[2] === null) {
        isAuthorized.value = false
        localStorage.removeItem('Token')
      }
    }

    // 4 - CallError
    if (msg[0] === MSG_TYPE.CALL_ERROR) {
      addResponseMessage(RESPONSE_MSG_TYPE.CALL_ERROR, msg)
    }

    // 8 - Event
    // перенос логов в список журнала
    if (msg[0] === MSG_TYPE.EVENT) {
      if (msg[2] && msg[2].Items) {
        SUBSCRIBE_LOGS.value.push(...msg[2].Items)
      }

      addResponseMessage(RESPONSE_MSG_TYPE.EVENT, msg)
    }
  }
}

function openConnection() {
  connection = new WebSocket(WS_URL, ['wamp'])
  isConnected.value = true

  setConnectionWatchers()
}

function clearCmdLogs() {
  LOG_MSGS.value = []
}

setConnectionWatchers()

watch(LOG_MSGS.value, () => {
  const messages = cmdLogsList.value

  messages.scrollTop = messages.scrollHeight
})
</script>

<style scoped lang="scss">
.content {
  height: 100%;
  max-height: 100%;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;

  height: 90vh;
  max-height: 90vh;
  margin: 24px 0;

  overflow: hidden;

  &__wrapper {
    padding: 16px;
    border: 1px solid gray;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.admin-panel {
  &__status {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__controls {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  &__logs-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;

    max-height: inherit;

    &.hidden {
      width: 0;
      overflow: hidden;
    }
  }

  &__cmd-logs {
    width: 500px;
    // margin-right: 24px;
  }

  &__journal-logs {
    width: 100%;
  }

  &__log-item {
    // white-space: nowrap;
  }
}

.status-marker {
  display: inline-block;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: red;

  &.connected {
    background-color: greenyellow;
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.log-panel {
  display: grid;
  grid-template-columns: auto 1fr;

  // display: flex;
  // flex-direction: column;

  gap: 24px;
  max-height: inherit;
}

.logs-block {
  border: 1px solid gray;
  padding: 8px;

  flex-grow: 1;
  overflow: auto;
}

.ui-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
