function jsonValidator () {
  return function email (value) {
    try{JSON.parse(value);return true;}catch{return false;};
  };
}

export {
  jsonValidator as jsonValidator,
};
