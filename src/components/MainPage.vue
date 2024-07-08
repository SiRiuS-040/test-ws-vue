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
      <button class="ui-button" @click="clearJournalLogs()">Очитить логи Журнала</button>
      <h2>Блок панели управления</h2>

      <div v-if="!isAuthorized && isConnected" class="admin-panel__login-form login-form">
        <input v-model="username" type="text" />
        <input v-model="password" type="text" />
        <button class="ui-button" @click="appLogin()">Log in</button>
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
        <button class="ui-button" @click="appLoginByToken()">Log by token</button>
      </div>
      <div v-if="isAuthorized" class="admin-panel__controls">
        <button class="ui-button" @click="appLogout()">Log out</button>
        <button class="ui-button" @click="appSubscribeList()">Получить данные Журнала</button>

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

        <button class="ui-button" @click="appSubscribe(subscribtionInput)">
          Оформить подписку
        </button>

        <button class="ui-button" @click="appUnubscribe(subscribtionInput)">Отписаться</button>
        <hr />
      </div>

      <div class="admin-panel__controls">
        <h2 v-if="isAuthorized && journalFilterLabels.length">Фильтр</h2>
        <div v-if="isAuthorized && journalFilterLabels.length" class="admin-panel__filters">
          <label v-for="(item, index) in journalFilterLabels" class="ui-checkbox" :key="index">
            <input
              v-model="selectedJournalFilters"
              :value="item"
              :checked="true"
              type="checkbox"
              class="ui-checkbox__input"
            />
            <span class="ui-checkbox__label">{{ item }}</span>
          </label>
        </div>
      </div>
    </div>
    <div class="log-panel">
      <div :class="cmdLogPanelClass" class="admin-panel__logs-wrapper admin-panel__cmd-logs">
        <h2>Блок логов команд</h2>
        <div v-if="CMD_LOG" class="logs-block" ref="cmdLogsList">
          <p
            v-for="(log, index) in CMD_LOG"
            :key="index"
            :class="{ error: log.msg[0] === MSG_TYPE.CALL_ERROR }"
            class="admin-panel__log-item"
          >
            {{ getLogMsg(log.type, JSON.stringify(log.msg)) }}
          </p>
        </div>
      </div>
      <div class="admin-panel__logs-wrapper admin-panel__journal-logs">
        <h2>Журнал работы</h2>
        <div v-if="true" class="logs-block" ref="journalLogsList">
          <p
            v-for="(log, index) in filteledJournalLogs"
            :key="index"
            :class="{
              error: log?.Level === 'ERROR',
              warning: log?.Level === 'WARN'
            }"
            class="admin-panel__log-item"
          >
            {{ `${log?.Timestamp} ${log?.Level} ${log?.Message} ${log?.Source}` }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { AppApi } from '@/app/api/appApi'
import {
  LoginData,
  LoginCall,
  LogItem,
  SubscribeCall,
  MSG_TYPE,
  CALL_TYPE,
  CALL_PATH,
  CALL_MSG_LABEL,
  RESPONSE_MSG_TYPE
} from '@/app/types/type'

import { generateId, getLogMsg } from '@/app/helpers/utils'

const WS_URL = 'ws://test.enter-systems.ru/'
let connection = new WebSocket(WS_URL, ['wamp'])

let heartBeatCounter = 0
const HERTBEAT_INTERVAL = 30000

const api = new AppApi()

const CMD_LOG = ref([] as string[])
const JOURNAL_LOGS = ref([] as string[])

const journalFilterLabels = ref([])
const selectedJournalFilters = ref([])

const filteledJournalLogs = computed(() => {
  console.log(selectedJournalFilters.value)

  return JOURNAL_LOGS.value.filter(({ Level }) => {
    return selectedJournalFilters.value.includes(Level)
  })
})

const username = ref('enter')
const password = ref('A505a')
const tokenInput = ref('')
const subscribtionInput = ref('')
const cmdLogsList = ref(null)
const journalLogsList = ref(null)
const loginData = reactive({
  username,
  password
} as LoginData)

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

const appLogin = () => {
  const args = [CALL_TYPE.LOGIN, generateId(16), CALL_PATH.LOGIN, loginData]
  addCmdLogMessage(CALL_MSG_LABEL.LOGIN, args)
  api.login(connection, args)
}

const appLoginByToken = () => {
  let token: string | null = tokenInput.value
  if (!tokenInput.value && localStorage.getItem('Token')) {
    token = localStorage.getItem('Token')
  }
  const args = [CALL_TYPE.LOGIN_BY_TOKEN, generateId(16), CALL_PATH.LOGIN_BY_TOKEN, token]
  addCmdLogMessage(CALL_MSG_LABEL.LOGIN_BY_TOKEN, args)
  api.loginByToken(connection, args)
}

const appLogout = () => {
  const args = [CALL_TYPE.LOGOUT, generateId(16), CALL_PATH.LOGOUT]
  addCmdLogMessage(CALL_MSG_LABEL.LOGOUT, args)
  api.logout(connection, args)
}

const appSubscribeList = () => {
  const args = [CALL_TYPE.SUBSCRIBE_LIST, CALL_PATH.SUBSCRIBE_LIST]
  addCmdLogMessage(CALL_MSG_LABEL.SUBSCRIBE_LIST, args)
  api.subscribeList(connection, args)
}

const appSubscribe = (subscription) => {
  const args = [CALL_TYPE.SUBSCRIBE, `${CALL_PATH.SUBSCRIBE}${subscription}`]
  addCmdLogMessage(CALL_MSG_LABEL.SUBSCRIBE, args)
  api.subscribe(connection, args)
}

const appUnubscribe = (subscription) => {
  const args = [CALL_TYPE.UNSUBSCRIBE, `${CALL_PATH.SUBSCRIBE}${subscription}`]
  addCmdLogMessage(CALL_MSG_LABEL.UNSUBSCRIBE, args)
  api.unsubscribe(connection, args)
}

const sendHeartBeat = () => {
  const args = [CALL_TYPE.HEART_BEAT, ++heartBeatCounter]
  addCmdLogMessage(CALL_MSG_LABEL.HEART_BEAT, args)
  api.sendHeartBeat(connection, args)
}

const addCmdLogMessage = (type: string, msg: any) => {
  CMD_LOG.value.push({ type, msg })
}

const getJournalFilters = (arr: any[]) => {
  const levelsArr = arr.map(function (item) {
    return item.Level
  })
  journalFilterLabels.value = Array.from(new Set(levelsArr))

  selectedJournalFilters.value = journalFilterLabels.value.slice()
}

const openConnection = () => {
  connection = new WebSocket(WS_URL, ['wamp'])
  isConnected.value = true
  setConnectionWatchers()
}

function setConnectionWatchers() {
  connection.onopen = function () {
    addCmdLogMessage(RESPONSE_MSG_TYPE.OPEN_CONNECTION, `Установка соединения c ${WS_URL}`)
    isConnected.value = true
  }

  let heartBeatInterval = setInterval(() => {
    sendHeartBeat()
  }, HERTBEAT_INTERVAL)

  connection.onclose = function (event) {
    if (event.wasClean) {
      addCmdLogMessage(RESPONSE_MSG_TYPE.DISCONNECTED_BY_USER, '')
    } else {
      addCmdLogMessage(RESPONSE_MSG_TYPE.NETWORK_ERROR, '')
    }

    clearInterval(heartBeatInterval)
    isConnected.value = false
    isAuthorized.value = false
    heartBeatCounter = 0
  }

  connection.onerror = function (error: any) {
    alert('Ошибка ' + error.message)
    addCmdLogMessage(RESPONSE_MSG_TYPE.RESPONSE_ERROR, 'Ошибка ' + error.message)
  }

  setMessageWatcher()
}

function setMessageWatcher() {
  connection.onmessage = function (event) {
    const msg = JSON.parse(event.data)

    // 0 - Welcome
    if (msg[0] === MSG_TYPE.WELCOME) {
      addCmdLogMessage(RESPONSE_MSG_TYPE.RESPONSE, msg)
    }

    // 3 - CallResult
    if (msg[0] === MSG_TYPE.CALL_RESULT) {
      addCmdLogMessage(RESPONSE_MSG_TYPE.RESPONSE, msg)

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
      addCmdLogMessage(RESPONSE_MSG_TYPE.CALL_ERROR, msg)
    }

    // 8 - Event
    // перенос логов в список журнала
    if (msg[0] === MSG_TYPE.EVENT) {
      if (msg[2] && msg[2].Items) {
        JOURNAL_LOGS.value.push(...msg[2].Items)
      }

      addCmdLogMessage(RESPONSE_MSG_TYPE.EVENT, msg)
      getJournalFilters(JOURNAL_LOGS.value)
    }

    // 20 - Heartbeat
    // обновление счетчика с ответа
    if (msg[0] === MSG_TYPE.HEART_BEAT) {
      heartBeatCounter = msg[1]
      addCmdLogMessage(RESPONSE_MSG_TYPE.HEART_BEAT, msg)
    }
  }
}

function clearCmdLogs() {
  CMD_LOG.value = []
}

function clearJournalLogs() {
  JOURNAL_LOGS.value = []
  journalFilterLabels.value = []
}

onMounted(() => {
  setConnectionWatchers()

  // selectedJournalFilters.value.forEach((item) => {
  //   console.log(item)
  //   item.checked = true
  // })
})

watch(CMD_LOG.value, () => {
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

  &__filters {
    display: flex;
    flex-direction: column;
    gap: 16px;
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
  }

  &__journal-logs {
    width: 100%;
  }

  &__log-item {
    &.error {
      color: red;
    }

    &.warning {
      color: lightcoral;
    }
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

.ui-checkbox {
  display: flex;
  gap: 4px;
}
</style>
