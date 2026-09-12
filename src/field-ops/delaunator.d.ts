declare module 'delaunator' {
  export default class Delaunator<T = number> {
    constructor(points: T[] | Float64Array);
    triangles: Uint32Array;
    halfedges: Int32Array;
    hull: Uint32Array;
    static from(points: number[] | Float64Array): Delaunator<number>;
  }
}
