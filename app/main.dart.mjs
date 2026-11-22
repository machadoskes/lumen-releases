// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: x0 => new Int16Array(x0),
      AC: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      AD: x0 => x0.screen,
      AE: x0 => new ResizeObserver(x0),
      AF: x0 => x0.key,
      AG: x0 => x0.v8BreakIterator,
      AH: (x0,x1) => { x0.scrollTop = x1 },
      AI: x0 => x0.offsetWidth,
      AJ: (x0,x1) => x0.postMessage(x1),
      AK: (x0,x1,x2) => x0.sqlite3_column_name(x1,x2),
      AL: (x0,x1,x2) => x0.getFileHandle(x1,x2),
      AM: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      AN: x0 => x0.naturalHeight,
      AO: (x0,x1,x2) => x0.open(x1,x2),
      AP: x0 => x0.imageBitmaps,
      AQ: x0 => x0.value,
      B: s => printToConsole(s),
      BB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      BC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      BD: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      BE: (x0,x1) => x0.getPropertyValue(x1),
      BF: x0 => x0.identifier,
      BG: () => globalThis.Intl,
      BH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      BI: x0 => x0.stopPropagation(),
      BJ: x0 => x0.close(),
      BK: (x0,x1,x2) => x0.sqlite3_column_blob(x1,x2),
      BL: x0 => ({create: x0}),
      BM: (x0,x1) => x0.getBigInt64(x1),
      BN: x0 => x0.naturalWidth,
      BO: x0 => globalThis.URL.revokeObjectURL(x0),
      BP: x0 => x0.canvasKitMaximumSurfaces,
      BQ: x0 => x0.done,
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: x0 => new Uint16Array(x0),
      CC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      CD: x0 => x0.tabIndex,
      CE: x0 => globalThis.parseFloat(x0),
      CF: x0 => x0.touches,
      CG: (x0,x1) => x0.segment(x1),
      CH: (x0,x1) => { x0.value = x1 },
      CI: x0 => x0.disabled,
      CJ: (x0,x1) => ({i: x0,p: x1}),
      CK: (x0,x1,x2) => x0.sqlite3_column_bytes(x1,x2),
      CL: (x0,x1,x2) => x0.getDirectoryHandle(x1,x2),
      CM: (x0,x1) => x0.getInt32(x1),
      CN: x0 => x0.decode(),
      CO: () => globalThis.window,
      CP: x0 => x0.hostElement,
      CQ: x0 => x0.read(),
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: x0 => new Int32Array(x0),
      DC: (x0,x1) => x0.querySelector(x1),
      DD: (x0,x1) => x0.contains(x1),
      DE: (x0,x1) => x0.getComputedStyle(x1),
      DF: x0 => x0.pressure,
      DG: x0 => x0.index,
      DH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      DI: (x0,x1) => { x0.min = x1 },
      DJ: () => new Array(),
      DK: (x0,x1,x2) => x0.sqlite3_column_text(x1,x2),
      DL: (x0,x1) => new URL(x0,x1),
      DM: (x0,x1) => x0.read(x1),
      DN: (x0,x1) => { x0.decoding = x1 },
      DO: () => new FileReader(),
      DP: x0 => x0.location,
      DQ: x0 => x0.body,
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      EC: (x0,x1) => x0.item(x1),
      ED: x0 => x0.activeElement,
      EE: x0 => x0.documentElement,
      EF: x0 => x0.tiltY,
      EG: x0 => x0.next(),
      EH: (x0,x1) => { x0.value = x1 },
      EI: (x0,x1) => { x0.max = x1 },
      EJ: (x0,x1) => ({c: x0,r: x1}),
      EK: (x0,x1,x2) => x0.sqlite3_column_double(x1,x2),
      EL: x0 => x0.pathname,
      EM: (x0,x1,x2) => x0.read(x1,x2),
      EN: (x0,x1) => { x0.crossOrigin = x1 },
      EO: (x0,x1) => x0.readAsArrayBuffer(x1),
      EP: (x0,x1) => x0.getModifierState(x1),
      EQ: (x0,x1) => new OffscreenCanvas(x0,x1),
      F: () => new Error().stack,
      FB: x0 => new Uint32Array(x0),
      FC: x0 => x0.length,
      FD: x0 => x0.parentNode,
      FE: x0 => x0.computedStyleMap(),
      FF: x0 => x0.tiltX,
      FG: x0 => x0.value,
      FH: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      FI: (x0,x1) => { x0.disabled = x1 },
      FJ: (x0,x1) => { x0.onmessage = x1 },
      FK: (x0,x1,x2) => x0.sqlite3_column_int64(x1,x2),
      FL: x0 => x0.getDirectory(),
      FM: x0 => x0.flush(),
      FN: (x0,x1) => x0.createObjectURL(x1),
      FO: x0 => x0.result,
      FP: x0 => x0.metaKey,
      FQ: x0 => x0.assetBase,
      G: s => JSON.stringify(s),
      GB: x0 => new Float32Array(x0),
      GC: (x0,x1) => x0.querySelectorAll(x1),
      GD: x0 => x0.tagName,
      GE: (x0,x1) => x0.get(x1),
      GF: x0 => x0.pointerType,
      GG: x0 => x0.done,
      GH: x0 => x0.value,
      GI: (x0,x1) => { x0.scrollLeft = x1 },
      GJ: (o, a) => o == a,
      GK: (x0,x1,x2) => x0.sqlite3_column_type(x1,x2),
      GL: x0 => x0.storage,
      GM: () => globalThis.WebAssembly,
      GN: x0 => x0.URL,
      GO: () => new XMLHttpRequest(),
      GP: x0 => x0.altKey,
      GQ: x0 => x0.loader,
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      HC: (x0,x1) => x0.getAttribute(x1),
      HD: x0 => x0.target,
      HE: (o, p) => p in o,
      HF: x0 => x0.pointerId,
      HG: (o, m, a) => o[m].apply(o, a),
      HH: x0 => x0.selectionDirection,
      HI: (x0,x1) => { x0.spellcheck = x1 },
      HJ: (o, t) => typeof o === t,
      HK: (x0,x1) => x0.sqlite3_column_count(x1),
      HL: () => globalThis.navigator,
      HM: x0 => x0.href,
      HN: x0 => new Blob(x0),
      HO: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      HP: x0 => x0.ctrlKey,
      HQ: () => globalThis._flutter,
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: x0 => new Float64Array(x0),
      IC: x0 => x0.remove(),
      ID: x0 => x0.clientY,
      IE: (x0,x1) => { x0.textContent = x1 },
      IF: x0 => x0.getCoalescedEvents(),
      IG: x0 => x0.iterator,
      IH: x0 => x0.selectionStart,
      II: (x0,x1) => { x0.disabled = x1 },
      IJ: x0 => x0.r,
      IK: (x0,x1) => x0.sqlite3_changes(x1),
      IL: (x0,x1) => globalThis.fetch(x0,x1),
      IM: (x0,x1) => x0.openCursor(x1),
      IN: x0 => x0.close(),
      IO: x0 => x0.send(),
      IP: x0 => x0.isComposing,
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      JC: (x0,x1) => x0.appendChild(x1),
      JD: x0 => x0.clientX,
      JE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      JF: (x0,x1) => x0.getModifierState(x1),
      JG: () => globalThis.Symbol,
      JH: x0 => x0.selectionEnd,
      JI: (x0,x1) => x0.getRandomValues(x1),
      JJ: x0 => x0.c,
      JK: (x0,x1,x2,x3,x4,x5,x6) => x0.dart_sqlite3_create_function_v2(x1,x2,x3,x4,x5,x6),
      JL: (x0,x1) => x0.sqlite3session_delete(x1),
      JM: x0 => x0.arrayBuffer(),
      JN: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      JO: x0 => x0.type,
      JP: x0 => x0.code,
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: x0 => new ArrayBuffer(x0),
      KC: (x0,x1) => x0.append(x1),
      KD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      KE: x0 => x0.matches,
      KF: s => s.trimLeft(),
      KG: (x0,x1) => new Intl.Segmenter(x0,x1),
      KH: x0 => x0.value,
      KI: () => globalThis.crypto,
      KJ: x0 => x0.p,
      KK: (x0,x1,x2,x3) => x0.sqlite3_result_error(x1,x2,x3),
      KL: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      KM: () => globalThis.Blob,
      KN: (x0,x1) => x0.decode(x1),
      KO: x0 => x0.response,
      KP: x0 => x0.repeat,
      L: o => o === undefined,
      LB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      LC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      LD: x0 => x0.getBoundingClientRect(),
      LE: (x0,x1) => x0.matchMedia(x1),
      LF: (x0,x1) => x0[x1],
      LG: x0 => x0.Segmenter,
      LH: x0 => x0.selectionDirection,
      LI: l => new DataView(new ArrayBuffer(l)),
      LJ: x0 => x0.i,
      LK: (x0,x1,x2) => x0.sqlite3_result_subtype(x1,x2),
      LL: (x0,x1) => x0.unregister(x1),
      LM: x0 => x0.value,
      LN: x0 => x0.displayHeight,
      LO: (x0,x1) => { x0.responseType = x1 },
      LP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      M: o => String(o),
      MB: (x0,x1,x2) => new DataView(x0,x1,x2),
      MC: x0 => x0.style,
      MD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      ME: x0 => x0.matches,
      MF: x0 => x0.index,
      MG: x0 => x0.buffer,
      MH: x0 => x0.selectionStart,
      MI: (a, i) => a.splice(i, 1),
      MJ: x0 => x0.port1,
      MK: (x0,x1,x2,x3,x4) => x0.sqlite3_result_blob64(x1,x2,x3,x4),
      ML: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      MM: x0 => x0.key,
      MN: x0 => x0.displayWidth,
      MO: x0 => x0.vendor,
      MP: x0 => x0.userAgent,
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: (o, p) => o[p],
      NC: x0 => x0.debugShowSemanticsNodes,
      ND: s => new Date(s * 1000).getTimezoneOffset() * 60,
      NE: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      NF: s => s.toUpperCase(),
      NG: x0 => x0.wasmMemory,
      NH: x0 => x0.selectionEnd,
      NI: a => a.pop(),
      NJ: (x0,x1,x2) => x0.transaction(x1,x2),
      NK: (x0,x1,x2,x3,x4) => x0.sqlite3_result_text(x1,x2,x3,x4),
      NL: x0 => new FinalizationRegistry(x0),
      NM: x0 => x0.continue(),
      NN: x0 => x0.duration,
      NO: x0 => x0.navigator,
      NP: (x0,x1) => x0.key(x1),
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      OC: o => o,
      OD: Date.now,
      OE: f => f.dartFunction,
      OF: x0 => x0.pop(),
      OG: () => globalThis.window._flutter_skwasmInstance,
      OH: x0 => x0.keyCode,
      OI: (map, o, v) => map.set(o, v),
      OJ: x0 => x0.close(),
      OK: (x0,x1,x2) => x0.sqlite3_result_double(x1,x2),
      OL: () => globalThis.FinalizationRegistry,
      OM: x0 => x0.error,
      ON: x0 => x0.image,
      OO: x0 => new Blob(x0),
      OP: x0 => x0.length,
      P: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      PC: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      PD: (handle) => clearTimeout(handle),
      PE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PF: x0 => x0.flags,
      PG: () => new TextDecoder(),
      PH: (x0,x1) => x0.scrollIntoView(x1),
      PI: (map, o) => map.get(o),
      PJ: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      PK: (x0,x1,x2) => x0.sqlite3_result_int64(x1,x2),
      PL: (x0,x1) => x0.sqlite3changeset_finalize(x1),
      PM: x0 => x0.result,
      PN: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      PO: x0 => globalThis.fetch(x0),
      PP: x0 => globalThis.Intl.supportedValuesOf(x0),
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: o => o.byteOffset,
      QC: (x0,x1) => x0.warn(x1),
      QD: (x0,x1) => x0.closest(x1),
      QE: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      QF: (a, s) => a.join(s),
      QG: (d, digits) => d.toFixed(digits),
      QH: x0 => x0.multiViewEnabled,
      QI: () => new WeakMap(),
      QJ: () => globalThis.Promise.resolve(),
      QK: (x0,x1) => x0.sqlite3_result_null(x1),
      QL: x0 => x0.exports,
      QM: (x0,x1) => globalThis.IDBKeyRange.bound(x0,x1),
      QN: x0 => new window.ImageDecoder(x0),
      QO: x0 => x0.arrayBuffer(),
      QP: () => globalThis.Intl.DateTimeFormat(),
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: o => o.buffer,
      RC: x0 => x0.console,
      RD: x0 => x0.bottom,
      RE: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      RF: (x0,x1) => x0.error(x1),
      RG: x0 => x0.maxHeight,
      RH: (x0,x1) => x0.replaceWith(x1),
      RI: x0 => new WeakRef(x0),
      RJ: (x0,x1) => x0.then(x1),
      RK: (x0,x1) => x0.sqlite3_value_blob(x1),
      RL: x0 => x0.call(),
      RM: x0 => x0.length,
      RN: x0 => x0.name,
      RO: (x0,x1) => globalThis.crypto.subtle.digest(x0,x1),
      RP: x0 => x0.resolvedOptions(),
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: Function.prototype.call.bind(DataView.prototype.getUint8),
      SC: () => globalThis.window,
      SD: x0 => x0.top,
      SE: (o, i) => o[i],
      SF: () => globalThis.console,
      SG: x0 => x0.maxWidth,
      SH: (x0,x1) => { x0.type = x1 },
      SI: x0 => x0.deref(),
      SJ: x0 => x0.abort(),
      SK: (x0,x1) => x0.sqlite3_value_bytes(x1),
      SL: x0 => x0.instance,
      SM: (x0,x1) => x0.get(x1),
      SN: x0 => x0.repetitionCount,
      SO: (x0,x1,x2) => globalThis.crypto.subtle.sign(x0,x1,x2),
      SP: x0 => x0.timeZone,
      T: x0 => new Promise(x0),
      TB: (b, o) => new DataView(b, o),
      TC: (o, c) => o instanceof c,
      TD: x0 => x0.right,
      TE: o => o.length,
      TF: s => s.trimRight(),
      TG: x0 => x0.minHeight,
      TH: (x0,x1) => { x0.className = x1 },
      TI: () => globalThis.WeakRef,
      TJ: x0 => x0.commit(),
      TK: (x0,x1) => x0.sqlite3_value_text(x1),
      TL: (x0,x1,x2) => x0.instantiateStreaming(x1,x2),
      TM: (x0,x1) => x0.index(x1),
      TN: x0 => x0.frameCount,
      TO: (x0,x1) => ({name: x0,hash: x1}),
      TP: (x0,x1) => x0.querySelector(x1),
      U: (x0,x1,x2) => x0.call(x1,x2),
      UB: (b, o, l) => new DataView(b, o, l),
      UC: (x0,x1) => x0.exec(x1),
      UD: x0 => x0.left,
      UE: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      UF: x0 => x0.blur(),
      UG: x0 => x0.minWidth,
      UH: (x0,x1) => { x0.tabIndex = x1 },
      UI: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      UJ: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      UK: (x0,x1) => x0.sqlite3_value_double(x1),
      UL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      UM: x0 => x0.openKeyCursor(),
      UN: x0 => x0.selectedTrack,
      UO: (x0,x1,x2,x3) => ({name: x0,hash: x1,salt: x2,info: x3}),
      UP: (x0,x1) => x0.createElement(x1),
      V: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      VB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      VC: x0 => x0.length,
      VD: x0 => x0.clientY,
      VE: x0 => x0.language,
      VF: x0 => x0.button,
      VG: x0 => x0.debugSkipFontRetryDelay,
      VH: (x0,x1) => { x0.name = x1 },
      VI: (a, s, e) => a.slice(s, e),
      VJ: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      VK: (x0,x1) => x0.sqlite3_value_int64(x1),
      VL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      VM: x0 => x0.primaryKey,
      VN: x0 => x0.completed,
      VO: (x0,x1,x2) => globalThis.crypto.subtle.deriveBits(x0,x1,x2),
      VP: (x0,x1) => x0.appendChild(x1),
      W: x0 => new Array(x0),
      WB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      WC: (x0,x1) => { x0.lastIndex = x1 },
      WD: x0 => x0.clientX,
      WE: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      WF: x0 => x0.innerHeight,
      WG: x0 => x0.status,
      WH: (x0,x1) => { x0.placeholder = x1 },
      WI: () => new MessageChannel(),
      WJ: (x0,x1) => { x0.onerror = x1 },
      WK: (x0,x1) => x0.sqlite3_value_type(x1),
      WL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3,x4) { return wasmFunction(f,arguments.length,x0,x1,x2,x3,x4) }),
      WM: (x0,x1,x2) => x0.open(x1,x2),
      WN: x0 => x0.ready,
      WO: (x0,x1) => x0.matchMedia(x1),
      WP: x0 => x0.body,
      X: o => [o],
      XB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      XC: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      XD: x0 => x0.changedTouches,
      XE: () => globalThis.window.FinalizationRegistry,
      XF: x0 => x0.innerWidth,
      XG: (x0,x1,x2) => x0.set(x1,x2),
      XH: (x0,x1) => { x0.autocomplete = x1 },
      XI: x0 => new BroadcastChannel(x0),
      XJ: x0 => new DOMException(x0),
      XK: (x0,x1,x2) => x0.sqlite3_extended_result_codes(x1,x2),
      XL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      XM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      XN: x0 => x0.tracks,
      XO: x0 => x0.matches,
      XP: (x0,x1) => { x0.id = x1 },
      Y: (o0, o1) => [o0, o1],
      YB: (t, s) => t.set(s),
      YC: o => o instanceof RegExp,
      YD: x0 => x0.offsetY,
      YE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      YF: x0 => x0.height,
      YG: x0 => x0.arrayBuffer(),
      YH: (x0,x1) => { x0.name = x1 },
      YI: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      YJ: x0 => x0.error,
      YK: (x0,x1,x2,x3,x4) => x0.sqlite3_open_v2(x1,x2,x3,x4),
      YL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3) { return wasmFunction(f,arguments.length,x0,x1,x2,x3) }),
      YM: (x0,x1) => { x0.onupgradeneeded = x1 },
      YN: () => globalThis.window.ImageDecoder,
      YO: x0 => x0.persist(),
      YP: () => globalThis.document,
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      ZC: (string, times) => string.repeat(times),
      ZD: x0 => x0.offsetX,
      ZE: x0 => new window.FinalizationRegistry(x0),
      ZF: x0 => x0.width,
      ZG: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      ZH: (x0,x1) => { x0.placeholder = x1 },
      ZI: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      ZJ: (x0,x1) => { x0.onabort = x1 },
      ZK: x0 => x0.sqlite3_initialize(),
      ZL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3) { return wasmFunction(f,arguments.length,x0,x1,x2,x3) }),
      ZM: x0 => ({autoIncrement: x0}),
      ZN: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      ZO: (x0,x1) => x0.getItem(x1),
      ZP: (x0,x1,x2) => x0.addEventListener(x1,x2),
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      aC: x0 => x0.dotAll,
      aD: x0 => x0.type,
      aE: (x0,x1) => x0.unregister(x1),
      aF: x0 => x0.clientHeight,
      aG: (x0,x1) => x0.fetch(x1),
      aH: (x0,x1) => { x0.action = x1 },
      aI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      aJ: (x0,x1) => { x0.oncomplete = x1 },
      aK: (x0,x1,x2,x3) => x0.dart_sqlite3_register_vfs(x1,x2,x3),
      aL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      aM: (x0,x1,x2) => x0.createObjectStore(x1,x2),
      aN: (x0,x1) => globalThis.fetch(x0,x1),
      aO: x0 => x0.localStorage,
      aP: x0 => x0.click(),
      b: (x0,x1,x2) => { x0[x1] = x2 },
      bB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      bC: x0 => x0.unicode,
      bD: x0 => x0.maxTouchPoints,
      bE: (x0,x1) => x0.contains(x1),
      bF: x0 => x0.clientWidth,
      bG: x0 => x0.fontFallbackBaseUrl,
      bH: (x0,x1) => { x0.method = x1 },
      bI: x0 => globalThis.Array.isArray(x0),
      bJ: (x0,x1) => x0.objectStore(x1),
      bK: (x0,x1) => globalThis.Atomics.load(x0,x1),
      bL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      bM: x0 => ({unique: x0}),
      bN: (x0,x1) => x0.get(x1),
      bO: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      bP: (x0,x1) => x0.removeChild(x1),
      c: o => o,
      cB: Function.prototype.call.bind(DataView.prototype.getUint32),
      cC: x0 => x0.ignoreCase,
      cD: x0 => x0.platform,
      cE: (s) => +s,
      cF: (x0,x1) => { x0.content = x1 },
      cG: (handle) => clearInterval(handle),
      cH: (x0,x1) => { x0.noValidate = x1 },
      cI: x0 => x0.table,
      cJ: (x0,x1) => x0.sqlite3_get_autocommit(x1),
      cK: (x0,x1,x2) => globalThis.Atomics.wait(x0,x1,x2),
      cL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      cM: (x0,x1,x2,x3) => x0.createIndex(x1,x2,x3),
      cN: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      cO: x0 => x0.history,
      cP: x0 => x0.firstChild,
      d: (o, p) => o[p],
      dB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      dC: x0 => x0.multiline,
      dD: x0 => x0.body,
      dE: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      dF: (x0,x1) => { x0.name = x1 },
      dG: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      dH: (x0,x1) => x0.removeAttribute(x1),
      dI: x0 => x0.kind,
      dJ: (x0,x1) => x0.sqlite3_finalize(x1),
      dK: (x0,x1,x2) => globalThis.Atomics.notify(x0,x1,x2),
      dL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      dM: (x0,x1) => x0.createObjectStore(x1),
      dN: (x0,x1) => x0.forEach(x1),
      dO: x0 => x0.href,
      dP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      e: () => globalThis,
      eB: Function.prototype.call.bind(DataView.prototype.getInt32),
      eC: (string, token) => string.split(token),
      eD: () => globalThis.document,
      eE: s => s.trim(),
      eF: x0 => x0.head,
      eG: () => Date.now(),
      eH: x0 => x0.isConnected,
      eI: x0 => x0.data,
      eJ: (x0,x1) => x0.sqlite3_reset(x1),
      eK: (x0,x1,x2) => globalThis.Atomics.store(x0,x1,x2),
      eL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3) { return wasmFunction(f,arguments.length,x0,x1,x2,x3) }),
      eM: x0 => x0.oldVersion,
      eN: x0 => x0.statusText,
      eO: x0 => x0.location,
      eP: (x0,x1) => x0.item(x1),
      f: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      fC: o => o instanceof Array,
      fD: (x0,x1,x2) => x0.addEventListener(x1,x2),
      fE: x0 => x0.classList,
      fF: (x0,x1) => x0.removeChild(x1),
      fG: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      fH: x0 => x0.click(),
      fI: x0 => x0.close(),
      fJ: x0 => x0.buffer,
      fK: (x0,x1,x2) => x0.setInt32(x1,x2),
      fL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3) { return wasmFunction(f,arguments.length,x0,x1,x2,x3) }),
      fM: () => globalThis.indexedDB,
      fN: x0 => x0.url,
      fO: (x0,x1) => x0.removeItem(x1),
      fP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: o => o instanceof Uint16Array,
      gC: (a, i) => a[i],
      gD: x0 => x0.hasFocus(),
      gE: x0 => x0.preventDefault(),
      gF: x0 => x0.firstChild,
      gG: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      gH: (x0,x1) => x0.getElementsByClassName(x1),
      gI: (x0,x1) => x0.postMessage(x1),
      gJ: (x0,x1) => x0.sqlite3_errstr(x1),
      gK: (x0,x1,x2) => x0.setBigInt64(x1,x2),
      gL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      gM: (x0,x1) => ({name: x0,length: x1}),
      gN: x0 => x0.status,
      gO: (x0,x1,x2) => x0.setItem(x1,x2),
      gP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: Function.prototype.call.bind(DataView.prototype.getUint16),
      hC: a => a.length,
      hD: x0 => x0.relatedTarget,
      hE: x0 => x0.parent,
      hF: x0 => x0.viewConstraints,
      hG: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      hH: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      hI: (x0,x1) => ({kind: x0,table: x1}),
      hJ: (x0,x1) => x0.sqlite3_errmsg(x1),
      hK: x0 => new Worker(x0),
      hL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      hM: (x0,x1) => x0.update(x1),
      hN: x0 => x0.getReader(),
      hO: (x0,x1) => new WebSocket(x0,x1),
      hP: x0 => x0.name,
      i: (l, r) => l === r,
      iB: o => o instanceof Int16Array,
      iC: (x0,x1) => x0.test(x1),
      iD: x0 => x0.shiftKey,
      iE: x0 => x0.timeStamp,
      iF: x0 => x0.hostElement,
      iG: o => o.byteLength,
      iH: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      iI: () => new AbortController(),
      iJ: (x0,x1) => x0.sqlite3_error_offset(x1),
      iK: (x0,x1,x2) => new DataView(x0,x1,x2),
      iL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      iM: x0 => x0.name,
      iN: x0 => x0.read(),
      iO: x0 => x0.reason,
      iP: x0 => x0.size,
      j: x0 => x0.random(),
      jB: Function.prototype.call.bind(DataView.prototype.getInt16),
      jC: x0 => x0.userAgent,
      jD: (decoder, codeUnits) => decoder.decode(codeUnits),
      jE: (x0,x1) => x0.hasAttribute(x1),
      jF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      jG: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      jH: (x0,x1) => x0.dispatchEvent(x1),
      jI: () => ({}),
      jJ: (x0,x1) => x0.sqlite3_extended_errcode(x1),
      jK: () => globalThis.Uint8Array,
      jL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      jM: x0 => globalThis.IDBKeyRange.only(x0),
      jN: x0 => x0.value,
      jO: x0 => x0.code,
      jP: x0 => x0.parentNode,
      k: o => o,
      kB: o => o instanceof Uint8ClampedArray,
      kC: x0 => x0.navigator,
      kD: () => new TextDecoder("utf-8", {fatal: true}),
      kE: x0 => x0.buttons,
      kF: x0 => ({runApp: x0}),
      kG: x0 => x0.history,
      kH: (x0,x1) => x0.createEvent(x1),
      kI: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      kJ: (x0,x1) => x0.sqlite3_step(x1),
      kK: x0 => x0.communicationBuffer,
      kL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      kM: (x0,x1,x2) => x0.put(x1,x2),
      kN: x0 => x0.done,
      kO: (x0,x1,x2) => x0.close(x1,x2),
      kP: x0 => x0.length,
      l: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      lB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      lC: Function.prototype.call.bind(String.prototype.toLowerCase),
      lD: () => new TextDecoder("utf-8", {fatal: false}),
      lE: x0 => x0.ctrlKey,
      lF: () => typeof dartUseDateNowForTicks !== "undefined",
      lG: x0 => x0.search,
      lH: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      lI: (x0,x1,x2,x3) => x0.request(x1,x2,x3),
      lJ: (x0,x1,x2,x3,x4) => x0.dart_sqlite3_bind_blob(x1,x2,x3,x4),
      lK: () => globalThis.Int32Array,
      lL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      lM: (x0,x1) => x0.getKey(x1),
      lN: x0 => x0.cancel(),
      lO: (x0,x1) => x0.close(x1),
      lP: x0 => x0.files,
      m: () => globalThis.Math,
      mB: Function.prototype.call.bind(DataView.prototype.setInt32),
      mC: Object.is,
      mD: (a, i, v) => a[i] = v,
      mE: x0 => x0.y,
      mF: () => Date.now(),
      mG: x0 => x0.location,
      mH: x0 => x0.readText(),
      mI: x0 => x0.name,
      mJ: (x0,x1) => x0.dart_sqlite3_malloc(x1),
      mK: x0 => x0.byteLength,
      mL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      mM: (x0,x1) => x0.delete(x1),
      mN: x0 => x0.body,
      mO: x0 => x0.close(),
      mP: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      n: (x0,x1) => x0.prepend(x1),
      nB: Function.prototype.call.bind(DataView.prototype.setUint32),
      nC: x0 => x0.vendor,
      nD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      nE: x0 => x0.x,
      nF: () => 1000 * performance.now(),
      nG: x0 => x0.pathname,
      nH: x0 => x0.clipboard,
      nI: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      nJ: (x0,x1,x2,x3,x4) => x0.dart_sqlite3_bind_text(x1,x2,x3,x4),
      nK: x0 => x0.synchronizationBuffer,
      nL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      nM: (x0,x1) => x0.put(x1),
      nN: x0 => x0.headers,
      nO: (x0,x1) => x0.send(x1),
      nP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      o: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      oB: Function.prototype.call.bind(DataView.prototype.setInt16),
      oC: (x0,x1) => x0.createTextNode(x1),
      oD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI16ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      oE: x0 => x0.scrollTop,
      oF: (x0,x1) => x0.requestAnimationFrame(x1),
      oG: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      oH: (x0,x1) => x0.writeText(x1),
      oI: (o, p, v) => o[p] = v,
      oJ: (x0,x1,x2,x3) => x0.sqlite3_bind_double(x1,x2,x3),
      oK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      oL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      oM: (x0,x1,x2) => x0.postMessage(x1,x2),
      oN: x0 => x0.signal,
      oO: x0 => x0.readyState,
      oP: x0 => x0.target,
      p: b => !!b,
      pB: Function.prototype.call.bind(DataView.prototype.setUint16),
      pC: (x0,x1) => { x0.id = x1 },
      pD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      pE: x0 => x0.offsetTop,
      pF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      pG: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      pH: x0 => x0.unlock(),
      pI: (o,s,v) => o[s] = v,
      pJ: (x0,x1,x2,x3) => x0.sqlite3_bind_int64(x1,x2,x3),
      pK: (x0,x1,x2) => x0.postMessage(x1,x2),
      pL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      pM: x0 => x0.randomUUID(),
      pN: x0 => globalThis.window.crypto.getRandomValues(x0),
      pO: (x0,x1) => { x0.binaryType = x1 },
      pP: (x0,x1) => { x0.display = x1 },
      q: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qB: Function.prototype.call.bind(DataView.prototype.setUint8),
      qC: (x0,x1) => { x0.nonce = x1 },
      qD: x0 => x0.visibilityState,
      qE: x0 => x0.scrollLeft,
      qF: x0 => x0.now(),
      qG: o => Object.keys(o),
      qH: (x0,x1) => x0.lock(x1),
      qI: () => Symbol("jsBoxedDartObjectProperty"),
      qJ: x0 => globalThis.BigInt(x0),
      qK: x0 => new SharedArrayBuffer(x0),
      qL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qM: () => globalThis.crypto,
      qN: () => globalThis.window.isSecureContext,
      qO: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qP: x0 => x0.style,
      r: (x0,x1) => x0.focus(x1),
      rB: Function.prototype.call.bind(DataView.prototype.setInt8),
      rC: x0 => x0.nonce,
      rD: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      rE: x0 => x0.offsetLeft,
      rF: x0 => x0.performance,
      rG: x0 => x0.state,
      rH: x0 => x0.orientation,
      rI: (x0,x1) => x0.call(x1),
      rJ: (x0,x1,x2) => x0.sqlite3_bind_null(x1,x2),
      rK: (x0,x1,x2,x3) => ({clientVersion: x0,root: x1,synchronizationBuffer: x2,communicationBuffer: x3}),
      rL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3,x4) { return wasmFunction(f,arguments.length,x0,x1,x2,x3,x4) }),
      rM: x0 => x0.port2,
      rN: () => globalThis.crypto.subtle,
      rO: (x0,x1) => { x0.onmessage = x1 },
      rP: (x0,x1) => { x0.accept = x1 },
      s: () => ({}),
      sB: Function.prototype.call.bind(DataView.prototype.getInt8),
      sC: () => globalThis.window.flutterConfiguration,
      sD: x0 => x0.disconnect(),
      sE: x0 => x0.offsetParent,
      sF: x0 => new Uint8Array(x0),
      sG: x0 => x0.hash,
      sH: (x0,x1) => x0.querySelector(x1),
      sI: x0 => x0.abort(),
      sJ: (x0,x1) => x0.sqlite3_bind_parameter_count(x1),
      sK: x0 => x0.close(),
      sL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3) { return wasmFunction(f,arguments.length,x0,x1,x2,x3) }),
      sM: x0 => x0.terminate(),
      sN: (x0,x1,x2,x3) => ({name: x0,iv: x1,additionalData: x2,tagLength: x3}),
      sO: (x0,x1) => x0.transferFromImageBitmap(x1),
      sP: (x0,x1) => { x0.multiple = x1 },
      t: (o, p, v) => o[p] = v,
      tB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      tC: (x0,x1) => x0.attachShadow(x1),
      tD: x0 => new Intl.Locale(x0),
      tE: (o, p, r) => o.replace(p, () => r),
      tF: (x0,x1,x2) => x0.slice(x1,x2),
      tG: x0 => x0.state,
      tH: (x0,x1) => { x0.title = x1 },
      tI: x0 => x0.locks,
      tJ: (x0,x1) => x0.dart_sqlite3_free(x1),
      tK: x0 => x0.getSize(),
      tL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3) { return wasmFunction(f,arguments.length,x0,x1,x2,x3) }),
      tM: (x0,x1) => new SharedWorker(x0,x1),
      tN: (x0,x1,x2) => globalThis.crypto.subtle.encrypt(x0,x1,x2),
      tO: (x0,x1) => x0.getContext(x1),
      tP: (x0,x1) => { x0.draggable = x1 },
      u: () => [],
      uB: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      uC: (x0,x1) => x0.createElement(x1),
      uD: x0 => x0.region,
      uE: (o, p, r) => o.replaceAll(p, () => r),
      uF: (x0,x1) => x0.decode(x1),
      uG: (x0,x1) => x0.go(x1),
      uH: (x0,x1) => x0.vibrate(x1),
      uI: () => globalThis.navigator,
      uJ: (x0,x1,x2,x3,x4,x5,x6) => x0.sqlite3_prepare_v3(x1,x2,x3,x4,x5,x6),
      uK: (x0,x1) => x0.truncate(x1),
      uL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3) { return wasmFunction(f,arguments.length,x0,x1,x2,x3) }),
      uM: x0 => x0.start(),
      uN: (x0,x1,x2,x3,x4) => globalThis.crypto.subtle.importKey(x0,x1,x2,x3,x4),
      uO: (x0,x1) => { x0.height = x1 },
      uP: (x0,x1) => { x0.type = x1 },
      v: (a, i) => a.push(i),
      vB: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      vC: x0 => x0.scale,
      vD: x0 => x0.script,
      vE: x0 => x0.deltaMode,
      vF: (x0,x1) => x0.adoptText(x1),
      vG: x0 => x0.parentElement,
      vH: x0 => x0.content,
      vI: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      vJ: (x0,x1) => x0.sqlite3_stmt_isexplain(x1),
      vK: x0 => ({at: x0}),
      vL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      vM: x0 => x0.port,
      vN: (x0,x1,x2) => globalThis.crypto.subtle.decrypt(x0,x1,x2),
      vO: (x0,x1) => { x0.width = x1 },
      vP: (x0,x1) => { x0.download = x1 },
      w: x0 => new Int8Array(x0),
      wB: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      wC: x0 => x0.visualViewport,
      wD: x0 => x0.language,
      wE: x0 => x0.deltaY,
      wF: x0 => x0.first(),
      wG: (x0,x1) => x0.querySelectorAll(x1),
      wH: x0 => x0.document,
      wI: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      wJ: (x0,x1,x2,x3,x4,x5) => x0.sqlite3_exec(x1,x2,x3,x4,x5),
      wK: (x0,x1) => x0.write(x1),
      wL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      wM: (a, b) => a == b ? 0 : (a > b ? 1 : -1),
      wN: Function.prototype.call.bind(DataView.prototype.getBigUint64),
      wO: x0 => x0.height,
      wP: (x0,x1) => { x0.target = x1 },
      x: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      xB: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      xC: x0 => x0.devicePixelRatio,
      xD: x0 => x0.languages,
      xE: x0 => x0.deltaX,
      xF: x0 => x0.next(),
      xG: (x0,x1) => x0.removeProperty(x1),
      xH: (x0,x1,x2) => x0.insertBefore(x1,x2),
      xI: (o, p) => p in o,
      xJ: (x0,x1) => x0.sqlite3_close_v2(x1),
      xK: (x0,x1,x2) => x0.write(x1,x2),
      xL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2,x3,x4) { return wasmFunction(f,arguments.length,x0,x1,x2,x3,x4) }),
      xM: (x0,x1) => x0.revokeObjectURL(x1),
      xN: x0 => ({type: x0}),
      xO: x0 => x0.width,
      xP: (x0,x1) => { x0.href = x1 },
      y: x0 => new Uint8Array(x0),
      yB: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      yC: x0 => x0.height,
      yD: (x0,x1) => x0.observe(x1),
      yE: x0 => x0.wheelDeltaY,
      yF: x0 => x0.current(),
      yG: (x0,x1) => x0.add(x1),
      yH: x0 => x0.id,
      yI: x0 => x0.groups,
      yJ: (x0,x1) => x0.sqlite3_last_insert_rowid(x1),
      yK: x0 => x0.createSyncAccessHandle(),
      yL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      yM: (x0,x1) => { x0.src = x1 },
      yN: (x0,x1) => new Blob(x0,x1),
      yO: x0 => x0.rasterEndMilliseconds,
      yP: x0 => x0.length,
      z: x0 => new Uint8ClampedArray(x0),
      zB: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      zC: x0 => x0.width,
      zD: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      zE: x0 => x0.wheelDeltaX,
      zF: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      zG: x0 => x0.data,
      zH: x0 => x0.offsetHeight,
      zI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      zJ: x0 => globalThis.Number(x0),
      zK: x0 => ({create: x0}),
      zL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      zM: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      zN: x0 => globalThis.URL.createObjectURL(x0),
      zO: x0 => x0.rasterStartMilliseconds,
      zP: x0 => x0.getReader(),

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
