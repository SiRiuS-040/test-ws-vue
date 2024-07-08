export class AppApi {
  login(connection: WebSocket, args: any[]) {
    connection.send(JSON.stringify(args))
  }

  loginByToken(connection: WebSocket, args: any[]) {
    connection.send(JSON.stringify(args))
  }

  logout(connection: WebSocket, args: any[]) {
    connection.send(JSON.stringify(args))
  }

  subscribeList(connection: WebSocket, args: any[]) {
    connection.send(JSON.stringify(args))
  }

  subscribe(connection: WebSocket, args: any[]) {
    connection.send(JSON.stringify(args))
  }

  unsubscribe(connection: WebSocket, args: any[]) {
    connection.send(JSON.stringify(args))
  }

  sendHeartBeat(connection: WebSocket, args: any[]) {
    connection.send(JSON.stringify(args))
  }
}
