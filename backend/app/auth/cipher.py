# app/auth/cipher.py

CHAR_TABLE = {
    1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'F', 7: 'G', 8: 'H', 9: 'I', 10: 'J',
    11: 'K', 12: 'L', 13: 'M', 14: 'N', 15: 'O', 16: 'P', 17: 'Q', 18: 'R', 19: 'S', 20: 'T',
    21: 'U', 22: 'V', 23: 'W', 24: 'X', 25: 'Y', 26: 'Z', 27: '0', 28: '1', 29: '2', 30: '3',
    31: '4', 32: '5', 33: '6', 34: '7', 35: '8', 36: '9', 37: ' ', 38: 'Ñ', 39: '@', 40: '.',
    41: '!', 42: '#', 43: '$', 44: '%', 45: '^', 46: '&', 47: '*', 48: '[', 49: ']', 50: '-',
    51: '_', 52: '=', 53: '+', 54: '/', 55: '\\', 56: ']', 57: '[', 58: '}', 59: '{', 60: ',',
    61: '<', 62: '>', 63: '?', 64: ':', 65: ';', 66: '\\', 67: '"', 68: '|', 69: '`', 70: '~'
}

CIPHER_TABLE = {
    1: 'T', 2: 'J', 3: 'H', 4: 'W', 5: 'S', 6: '1', 7: 'N', 8: 'Z', 9: 'Q', 10: '7',
    11: 'G', 12: 'Y', 13: '5', 14: 'M', 15: '0', 16: 'C', 17: 'F', 18: 'R', 19: 'X', 20: '8',
    21: 'I', 22: '4', 23: 'U', 24: 'L', 25: 'A', 26: '6', 27: 'E', 28: '3', 29: '¡', 30: '9',
    31: 'V', 32: 'O', 33: '2', 34: 'D', 35: 'P', 36: 'K', 37: 'B', 38: '.', 39: 'Ñ', 40: ',',
    41: '<', 42: '>', 43: '?', 44: ':', 45: ';', 46: '¤', 47: 'Ú', 48: '|', 49: '`', 50: '~',
    51: '!', 52: '#', 53: '$', 54: '%', 55: '^', 56: '&', 57: '*', 58: '(', 59: ']', 60: '-',
    61: '_', 62: '=', 63: '+', 64: '/', 65: '\\', 66: ']', 67: '[', 68: '}', 69: '{', 70: '¿'
}

_CHAR_TABLE_REVERSED  = {v: k for k, v in CHAR_TABLE.items()}
_CIPHER_TABLE_REVERSED = {v: k for k, v in CIPHER_TABLE.items()}
MAX_INDEX = 70


def encrypt(value: str) -> str:
    value = value.upper().strip()
    length = len(value)
    result = ""
    for char in value:
        pos = _CHAR_TABLE_REVERSED.get(char)
        if pos is None:
            result += char
            continue
        cipher_pos = pos + length
        if cipher_pos > MAX_INDEX:
            cipher_pos -= MAX_INDEX
        result += CIPHER_TABLE.get(cipher_pos, "")
    return result


def decrypt(value: str) -> str:
    value = value.upper().strip()
    length = len(value)
    result = ""
    for char in value:
        cipher_pos = _CIPHER_TABLE_REVERSED.get(char)
        if cipher_pos is None:
            result += char
            continue
        pos = cipher_pos - length
        if pos < 1:
            pos += MAX_INDEX
        result += CHAR_TABLE.get(pos, "")
    return result