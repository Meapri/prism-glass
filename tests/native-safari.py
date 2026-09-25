"""Run on a macOS CI runner with Safari Remote Automation enabled."""
import io
import json
import subprocess
import time
import urllib.request
from pathlib import Path
from PIL import Image, ImageChops
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait

server = subprocess.Popen(['node', 'scripts/serve.mjs'])
driver = None
try:
    for attempt in range(50):
        try:
            urllib.request.urlopen('http://localhost:4173', timeout=1).close()
            break
        except OSError:
            time.sleep(.1)
    driver = webdriver.Safari()
    driver.set_window_size(1280, 1000)
    print('Native Safari:', json.dumps(driver.capabilities), flush=True)
    driver.get('http://localhost:4173')
    wait = WebDriverWait(driver, 30)
    wait.until(lambda d: d.find_element(By.ID, 'status').text == 'SVG source')
    driver.find_element(By.ID, 'pin').click()
    driver.execute_script("""
      for (const [id, value] of [['highlight', 0], ['blur', 0], ['strength', 40]]) {
        const input = document.getElementById(id); input.value = value;
        input.dispatchEvent(new Event('input', {bubbles: true}));
      }
    """)
    driver.execute_async_script('const done=arguments[0];requestAnimationFrame(()=>requestAnimationFrame(done))')
    source = driver.find_element(By.ID, 'source')
    bent = Image.open(io.BytesIO(source.screenshot_as_png)).convert('RGB')
    driver.find_element(By.ID, 'effect').click()
    wait.until(lambda d: d.find_element(By.ID, 'status').text == 'disabled')
    flat = Image.open(io.BytesIO(source.screenshot_as_png)).convert('RGB')
    changed = sum(sum(pixel) > 35 for pixel in ImageChops.difference(bent, flat).getdata())
    print('Refracted pixels, without frost or highlight:', changed, flush=True)
    assert changed > 300, 'Safari must displace pixels, not merely show a glass highlight'
    driver.find_element(By.ID, 'glass-switch').click()
    assert driver.find_element(By.ID, 'glass-switch').get_attribute('aria-checked') == 'true'
    slider = driver.find_element(By.ID, 'glass-slider')
    slider.send_keys(Keys.ARROW_RIGHT)
    assert driver.find_element(By.ID, 'slider-value').text == '51'
    driver.find_element(By.CSS_SELECTOR, '.notes summary').click()
    driver.find_element(By.ID, 'run-tests').click()
    wait.until(lambda d: d.find_element(By.ID, 'test-results').get_attribute('data-result') in ['passed', 'failed'])
    assert driver.find_element(By.ID, 'test-results').get_attribute('data-result') == 'passed', driver.find_element(By.ID, 'test-results').text
    print('Native Safari refraction, controls, and lifecycle checks passed.', flush=True)
except Exception:
    if driver:
        Path('test-results').mkdir(exist_ok=True)
        driver.save_screenshot('test-results/native-safari.png')
    raise
finally:
    if driver:
        driver.quit()
    server.terminate()
