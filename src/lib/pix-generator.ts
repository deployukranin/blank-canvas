/**
 * Gerador de PIX BRCode (padrão EMV)
 * Gera payload "copia e cola" para QR codes PIX estáticos
 */

function computeCRC16(payload: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export interface PixPayload {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number; // in BRL (e.g. 29.90)
  txId?: string;
}

export function generatePixBRCode(data: PixPayload): string {
  const gui = tlv('00', 'br.gov.bcb.pix');
  const key = tlv('01', data.pixKey);
  const merchantAccountInfo = tlv('26', gui + key);

  const payloadFormatIndicator = tlv('00', '01');
  const mcc = tlv('52', '0000');
  const currency = tlv('53', '986');
  const amount = tlv('54', data.amount.toFixed(2));
  const country = tlv('58', 'BR');
  const merchantName = tlv('59', data.merchantName.substring(0, 25));
  const merchantCity = tlv('60', data.merchantCity.substring(0, 15));
  
  const txId = tlv('05', (data.txId || '***').substring(0, 25));
  const additionalData = tlv('62', txId);

  const payloadWithoutCRC =
    payloadFormatIndicator +
    merchantAccountInfo +
    mcc +
    currency +
    amount +
    country +
    merchantName +
    merchantCity +
    additionalData +
    '6304'; // CRC placeholder

  const crc = computeCRC16(payloadWithoutCRC);
  return payloadWithoutCRC + crc;
}
