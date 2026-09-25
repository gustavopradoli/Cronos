"""
Script de teste de erro e gravação de logs de falha no histórico.
"""
import time
import socketio
import requests

sio = socketio.Client()
finished = False

@sio.event
def connect():
    sio.emit("register", {
        "client_name": "TestRunner",
        "machine_name": "GUSKPC",
        "secret": "cronos_secret_123456789",
        "socket_id": sio.sid
    })

@sio.on("start_process")
def on_start_process(data):
    global finished
    print("[Error Test] Recebido start_process para teste de erro:", data)
    time.sleep(0.5)
    sio.emit("process_finished", {
        "automation_id": data["automation_id"],
        "machine_name": "GUSKPC",
        "status": "erro",
        "return_code": 1,
        "message": "Falha fatal: Gateway bancario retornou Timeout 504 no endpoint /v1/saldos apos 3 tentativas de conexao."
    })
    finished = True

def main():
    sio.connect("http://localhost:3002", transports=["websocket", "polling"])
    time.sleep(1)
    
    # Dispara automação 2
    res = requests.post("http://localhost:3001/api/execucoes/disparar", json={
        "automacao_id": 2,
        "maquina_id": 1
    })
    assert res.status_code == 200
    
    time.sleep(2)
    assert finished, "Nao finalizou!"
    
    # Verifica no historico
    hist = requests.get("http://localhost:3001/api/historico").json()["data"]["items"]
    latest = hist[0]
    print(f"[Error Test] Status gravado: {latest['status']}")
    print(f"[Error Test] Mensagem de erro gravada: {latest['erro']}")
    
    assert latest["status"] == "erro"
    assert "Timeout 504" in latest["erro"]
    print(">>> [Error Test] ERRO E LOG GRAVADOS COM SUCESSO NO BANCO! <<<")
    sio.disconnect()

if __name__ == "__main__":
    main()
