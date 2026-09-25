"""
Script de teste ponta a ponta do Orquestrador Cronos e Client Python (sem caracteres especiais).
"""
import time
import socketio
import requests

sio = socketio.Client()
auth_received = False
process_received = False
finished_emitted = False

@sio.event
def connect():
    print("[E2E Test] Socket conectado. Enviando registro com secret...")
    sio.emit("register", {
        "client_name": "TestRunner",
        "machine_name": "GUSKPC",
        "secret": "cronos_secret_123456789",
        "socket_id": sio.sid
    })

@sio.on("auth_success")
def on_auth_success(data):
    global auth_received
    auth_received = True
    print("[E2E Test] [OK] Autenticacao aceita pelo orquestrador:", data.get("message"))

@sio.on("start_process")
def on_start_process(data):
    global process_received, finished_emitted
    process_received = True
    print("[E2E Test] [OK] start_process recebido com sucesso:", data)
    
    # Simula término imediato de sucesso
    time.sleep(0.5)
    sio.emit("process_finished", {
        "automation_id": data["automation_id"],
        "machine_name": "GUSKPC",
        "status": "sucesso",
        "return_code": 0,
        "message": "Processo de teste concluido com exito."
    })
    finished_emitted = True
    print("[E2E Test] [OK] process_finished emitido para o orquestrador.")

def main():
    sio.connect("http://localhost:3002", transports=["websocket", "polling"])
    time.sleep(1)
    
    assert auth_received, "Autenticacao falhou!"
    
    # 2. Testa disparar execução via API REST do backend
    print("[E2E Test] Solicitando disparo via POST /api/execucoes/disparar...")
    res = requests.post("http://localhost:3001/api/execucoes/disparar", json={
        "automacao_id": 1,
        "maquina_id": 1
    })
    print("[E2E Test] Resposta do disparo:", res.json())
    assert res.status_code == 200, f"Falha no disparo: {res.text}"
    
    # Aguarda o ciclo de finalização
    time.sleep(2)
    assert process_received, "start_process nao foi recebido pelo socket client!"
    assert finished_emitted, "process_finished nao foi processado!"
    
    # 3. Consulta o histórico na API
    hist_res = requests.get("http://localhost:3001/api/historico")
    hist_data = hist_res.json()["data"]["items"]
    print(f"[E2E Test] Total de registros no historico: {len(hist_data)}")
    assert len(hist_data) > 0, "Nenhum historico gravado!"
    print(f"[E2E Test] Status do registro mais recente: {hist_data[0]['status']}")
    assert hist_data[0]["status"] == "sucesso", f"Status esperado 'sucesso', obtido: {hist_data[0]['status']}"
    
    print("\n>>> [E2E Test] TESTE PONTA A PONTA CONCLUIDO COM 100% DE SUCESSO! <<<")
    sio.disconnect()

if __name__ == "__main__":
    main()
