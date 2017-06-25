#静态页面抓取：从风之动漫上抓取火星异种

import requests
from pathlib import Path
from html.parser import HTMLParser
import time

base_url = 'http://www.fzdm.com/manhua/47'
page_url = ''
pic_url = ''
pic_path = ''

class MyHTMLParser(HTMLParser):
    def handle_starttag(self, tag, attrs):
    	if tag == 'img':
    		has_url = False
    		url = ''
    		for attr in attrs:
    			if attr[0] == 'src':
    				url = attr[1]
    			elif attr[0] == 'id' and attr[1] == 'mhpic':
    				has_url = True
    				break
    		if has_url:
    			global pic_url
    			if 'http' in url:
    				pic_url = url
    			else:
    				pic_url = 'http:' + url

parser = MyHTMLParser()

def getPage():
	try:
		r = requests.get(page_url, timeout=1)
	except Exception as err:
		return -1
	if r.status_code == 200:
		text = r.text
		parser.feed(text)
		getPic()
		return 0
	elif r.status_code == 404:
		print('page: %s: %s' % (r.url, r.text))
		return 1
	else:
		print('page: %s: %s' % (r.url, r.text))
		return -1

def getPic():
	try:
		r = requests.get(pic_url, timeout=1)
	except Exception as err:
		return -1
	if r.status_code == 200:
		p = Path(pic_path)
		p.write_bytes(r.content)
		print('pic: %s: saved!' % (r.url))
		return 0
	else:
		print('pic: %s: %s' % (r.url, r.text))
		return -1

def run():
	#获取当前页
	p = Path('./start.txt')
	start = int(p.read_text())
	print('Page %s:' % start)
	end = 175

	num = 0
	while start <= end:
		time.sleep(0.3)

		#检测文件夹是否存在
		dir_path = './pics/%s' % start
		if Path(dir_path).exists() != True:
			Path(dir_path).mkdir()

		#检测文件是否存在
		global pic_path
		pic_path = '%s/%s.jpg' % (dir_path, num)
		if Path(pic_path).exists() == True:
			print('file: %s exists' % pic_path)
			num += 1
			continue

		global page_url
		page_url = '%s/%s/index_%s.html' % (base_url, start, num)
		page_ret = getPage()
		if page_ret == 0:
			num += 1
		elif page_ret == 1:
			num = 0
			start += 1
			print('Page %s:' % start)
			p.write_text(str(start))
		else:
			pass

run()