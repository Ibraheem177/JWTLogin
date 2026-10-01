const { chromium } = require('../.local/browser/node_modules/playwright-core');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  let tokens;
  page.on('response', async response => {
    if (response.url().endsWith('/protocol/openid-connect/token') && response.ok()) {
      tokens = await response.json();

    }
  });
  try {
    await page.goto('http://localhost:3000/');
    await page.getByRole('button', {name: 'Sign in', exact: true}).click();
    await page.waitForURL('**/realms/jwt-login/protocol/openid-connect/auth**');
    assert.equal(new URL(page.url()).searchParams.get('code_challenge_method'), 'S256');
    assert.equal(new URL(page.url()).searchParams.get('response_type'), 'code');
    await page.locator('#username').fill('alice');
    await page.locator('#password').fill('wrong-password');
    await page.locator('#kc-login').click();
    await page.getByText('Invalid username or password.', {exact: true}).waitFor();
    console.log('PASS wrong password rejected');
    await page.locator('#password').fill('Alice-demo-123!');
    await page.locator('#kc-login').click();
    await page.getByRole('heading', {name: 'Welcome, alice'}).waitFor();
    assert(tokens?.access_token, 'Expected a real Keycloak access token');
    const tokenBody = JSON.parse(Buffer.from(tokens.access_token.split('.')[1], 'base64url').toString());
    assert.equal(tokenBody.iss, 'http://localhost:9090/realms/jwt-login');
    assert([tokenBody.aud].flat().includes('jwt-login-api'));
    console.log('PASS real login, issuer, audience and protected profile');
    assert.equal(await page.evaluate(() => localStorage.getItem('jwt')), null);
    await page.screenshot({path: '.local/keycloak-profile.png'});
    await page.reload();
    await page.getByRole('heading', {name: 'Welcome, alice'}).waitFor();
    console.log('PASS reload restores Keycloak session without localStorage tokens');
    const anonymous = await fetch('http://localhost:8080/api/users/me');
    assert.equal(anonymous.status, 401);
    const fake = await fetch('http://localhost:8080/api/users/me', {headers: {Authorization:'Bearer invalid'}});
    assert.equal(fake.status, 401);
    console.log('PASS anonymous and malformed-token requests return 401');
    const refreshed = await fetch('http://localhost:9090/realms/jwt-login/protocol/openid-connect/token', {
      method: 'POST', body: new URLSearchParams({grant_type: 'refresh_token',
        client_id: 'jwt-login-react', refresh_token: tokens.refresh_token}),
    });
    assert.equal(refreshed.status, 200);
    const refreshedTokens = await refreshed.json();
    const profile = await fetch('http://localhost:8080/api/users/me', {
      headers: {Authorization: `Bearer ${refreshedTokens.access_token}`},
    });
    assert.equal(profile.status, 200);
    console.log('PASS real refresh grant returns an accepted access token');
    await page.getByRole('button', {name: 'Log out', exact: true}).click();
    await page.getByRole('button', {name: 'Sign in', exact: true}).waitFor();
    await page.reload();
    await page.getByRole('button', {name: 'Sign in', exact: true}).waitFor();
    console.log('PASS logout ends the Keycloak session');
    await page.getByRole('button', {name: 'Create an account'}).click();
    await page.locator('#username').waitFor();
    const username = `smoke-${Date.now()}`;
    await page.locator('#username').fill(username);
    await page.locator('#password').fill('Smoke-demo-123!');
    await page.locator('#password-confirm').fill('Smoke-demo-123!');
    await page.locator('#email').fill(`${username}@example.test`);
    await page.locator('#firstName').fill('Smoke');
    await page.locator('#lastName').fill('Test');
    await page.locator('input[type=submit]').click();
    await page.getByRole('heading', {name: `Welcome, ${username}`}).waitFor();
    console.log('PASS self-registration and profile for a new Keycloak user');
    await page.getByRole('button', {name: 'Log out', exact: true}).click();
    await page.getByRole('button', {name: 'Sign in', exact: true}).waitFor();
    assert.deepEqual(errors, []);
    console.log('Browser errors:', errors);
    await page.screenshot({path: '.local/keycloak-signed-out.png'});
  } catch (error) {
    console.error('Page:', new URL(page.url()).origin + new URL(page.url()).pathname);
    console.error((await page.locator('body').innerText()).slice(0,4000));
    console.error('Browser errors:', errors);
    throw error;
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
