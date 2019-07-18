newNames = finalNames.map(name => {
  const oldArray = name.PutRequest.Item["guest-names"]
    ? name.PutRequest.Item["guest-names"].L
    : name.PutRequest.Item["names"];
  const newArray = [];
  for (var i = 0; i < oldArray.length; i++) {
    newArray.push({ S: oldArray[i] });
  }
  name.PutRequest.Item["guest-names"].L = newArray;
  return name;
});
