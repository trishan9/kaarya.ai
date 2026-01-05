async function deepResolvePromises(input) {
  if (input instanceof Promise) {
    return await input;
  }

  if (Array.isArray(input)) {
    const resolvedArray = await Promise.all(input.map(deepResolvePromises));
    return resolvedArray;
  }

  if (input instanceof Date) {
    return input;
  }

  if (typeof input === 'object' && input !== null) {
    const hasToJson =
      typeof (input as { toJSON?: () => unknown }).toJSON === 'function';
    const isPlainObject = Object.getPrototypeOf(input) === Object.prototype;
    if (hasToJson && !isPlainObject) {
      const json = (input as { toJSON: () => unknown }).toJSON();
      return await deepResolvePromises(json);
    }
  }

  if (typeof input === 'object' && input !== null) {
    const keys = Object.keys(input);
    const resolvedObject = {};

    for (const key of keys) {
      const resolvedValue = await deepResolvePromises(input[key]);
      resolvedObject[key] = resolvedValue;
    }

    return resolvedObject;
  }

  return input;
}

export default deepResolvePromises;
