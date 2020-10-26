import {createKeypairFromPeerId, ENR, ENRKey, ENRValue} from "@chainsafe/discv5";
import {writeFileSync, readFileSync} from "fs";
import PeerId from "peer-id";

/**
 * `FileENR` is an `ENR` that saves the ENR contents to a file on every modification
 */
export class FileENR extends ENR {
  private filename!: string;
  private localPeerId!: PeerId;

  constructor(
    filename: string,
    peerId: PeerId,
    kvs: Record<string, Uint8Array> | undefined,
    seq: bigint,
    signature: Buffer | null
  ) {
    super(kvs, seq, signature);
    Object.setPrototypeOf(this, FileENR.prototype);
    this.filename = filename;
    this.localPeerId = peerId;
    return this;
  }

  static initFromFile(filename: string, peerId: PeerId): FileENR {
    const enr = FileENR.decodeTxt(readFileSync(filename, "utf8")) as FileENR;
    return this.initFromENR(filename, peerId, enr);
  }
  static initFromENR(filename: string, peerId: PeerId, enr: FileENR): FileENR {
    const kvs = Array.from(enr.entries()).reduce((obj: Record<ENRKey, ENRValue>, kv) => {
      obj[kv[0]] = kv[1];
      return obj;
    }, {});
    return new FileENR(filename, peerId, kvs, enr.seq, enr.signature);
  }

  saveToFile(): void {
    if (!this.localPeerId) return;
    const keypair = createKeypairFromPeerId(this.localPeerId);
    writeFileSync(this.filename, this.encodeTxt(keypair.privateKey));
  }

  set(key: ENRKey, value: ENRValue): this {
    super.set(key, value);
    this.saveToFile();
    return this;
  }

  delete(key: ENRKey): boolean {
    const result = super.delete(key);
    this.saveToFile();
    return result;
  }
}
