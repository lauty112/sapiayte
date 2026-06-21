# generar_qr_mesas.py
import qrcode
#import image
from conexion import get_connection

def generar_qr_para_mesas():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id_mesa, numero, qr_token FROM mesas")
    mesas = cursor.fetchall()
    
    for mesa in mesas:
        # Generar URL con el token
        url = f"https://sapiayte.vercel.app/qr-scanner.html?token={mesa[2]}"
        
        qr = qrcode.make(url)
        qr.save(f"qr_mesa_{mesa[1]}.png")
        print(f"✅ QR generado para Mesa {mesa[1]}")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    generar_qr_para_mesas()