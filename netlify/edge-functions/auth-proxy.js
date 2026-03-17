export default async (request) => {
  const url = new URL(request.url);
  const target = `https://bg-jojo.firebaseapp.com${url.pathname}${url.search}`;
  return fetch(target, { headers: request.headers });
};

export const config = { path: "/__/auth/*" };
