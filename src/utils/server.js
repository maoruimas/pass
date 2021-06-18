export default {
  async request(api, params) {
    let form = new FormData();
    for (let key in params) {
      form.append(key, params[key]);
    }

    let r = await fetch(`php/${api}.php`, {
      method: 'POST',
      body: form
    });

    if (!r.ok) {
      throw new Error(`${r.status} ${r.statusText}`);
    }

    let json = await r.text();
    let response = JSON.parse(json);

    if (response.retcode === 0) {
      return response.data;
    } else {
      throw new Error(response.message);
    }
  }
}