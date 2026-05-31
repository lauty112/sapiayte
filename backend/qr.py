# generar_qr_mesas.py
import qrcode
#import image
from conexion import conectar_bd

def generar_qr_para_mesas():
    conn = conectar_bd()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id_mesa, numero, qr_token FROM mesas")
    mesas = cursor.fetchall()
    
    for mesa in mesas:
        # Generar URL con el token
        url = f"http://localhost:5500/qr-scanner.html?token={mesa[2]}"
        
        qr = qrcode.make(url)
        qr.save(f"qr_mesa_{mesa[1]}.png")
        print(f"✅ QR generado para Mesa {mesa[1]}")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    generar_qr_para_mesas()