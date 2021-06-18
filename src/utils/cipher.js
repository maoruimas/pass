import AES from "crypto-js/aes";
import ENC from "crypto-js/enc-utf8";
import SHA256 from "crypto-js/sha256"

export default {
  encrypt(plainText, key) {
    return AES.encrypt(plainText, key).toString();
  },
  decrypt(cipherText, key) {
    let t = AES.decrypt(cipherText, key);
    return ENC.stringify(t);
  },
  getHash(plainText) {
    return SHA256(plainText).toString();
  }
}