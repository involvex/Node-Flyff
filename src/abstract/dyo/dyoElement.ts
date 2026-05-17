import { Vector3 } from "../vector3";
import { BinaryStream } from "../../libraries/binaryStream";

export class DyoElement {
  elementType: number = 0;
  angle: number = 0;
  axis: Vector3;
  position: Vector3;
  scale: Vector3;
  type: number = 0;
  index: number = 0;
  motion: number = 0;
  iaInterface: number = 0;
  ia2: number = 0;

  constructor () {
    this.axis = new Vector3();
    this.position = new Vector3();
    this.scale = new Vector3();
  }

  read (streamReader: BinaryStream): void {
    this.angle = streamReader.readSingle();
    this.axis.x = streamReader.readSingle();
    this.axis.y = streamReader.readSingle();
    this.axis.z = streamReader.readSingle();
    this.position.x = streamReader.readSingle() * 4; // Adjust as needed
    this.position.y = streamReader.readSingle();
    this.position.z = streamReader.readSingle() * 4; // Adjust as needed
    this.scale.x = streamReader.readSingle();
    this.scale.y = streamReader.readSingle();
    this.scale.z = streamReader.readSingle();
    this.type = streamReader.readInt32LE();
    this.index = streamReader.readInt32LE();
    this.motion = streamReader.readInt32LE();
    this.iaInterface = streamReader.readInt32LE();
    this.ia2 = streamReader.readInt32LE();
  }
}
