# -*- coding: utf-8 -*
# try:
#     import urllib.parse
# except ImportError:
#     import urlparse
# import urllib
from urlparse import urlparse
import requests
from bs4 import BeautifulSoup
import sys    
import json
# sys.stdout.reconfigure(encoding='utf-8')

MOMO_MOBILE_URL = 'https://m.momoshop.com.tw/'
# MOMO_QUERY_URL = MOMO_MOBILE_URL + 'mosearch/%s.html'
MOMO_QUERY_URL = MOMO_MOBILE_URL + 'search.momo?searchKeyword=%s&searchType=%s'
USER_AGENT_VALUE = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36'
SEARCH_TYPE = 1 # 1:總和排序, 2:價格有低到高, 3:價格有高到低, 6:銷量排行

def getSearchType(query_type):
    if(query_type == "overall"):
        return 1
    elif (query_type == "cheapFirst"):
        return 2
    elif (query_type == "expensiveFirst"):
        return 3
    elif (query_type == "sellFirst"):
        return 6
    else:
        return 1

def get_search_content(query,query_type):
    # encoded_query = urllib.parse.quote(query)        
    encoded_query = quote(query)  
    # encoded_query = urllib.quote_plus(query)
    # query_url = MOMO_QUERY_URL % (encoded_query)
    SEARCH_TYPE = getSearchType(query_type)
    # print("search_type", query_type,", ",SEARCH_TYPE)
    query_url = MOMO_QUERY_URL % (encoded_query, SEARCH_TYPE)
    headers = {'User-Agent': USER_AGENT_VALUE}
    resp = requests.get(query_url, headers=headers)
    # print('resp:',resp.text)
    if not resp:
        return []
    resp.encoding = 'UTF-8'
    return BeautifulSoup(resp.text, 'html.parser')

def get_product_content(query):
    headers = {'User-Agent': USER_AGENT_VALUE}
    resp = requests.get(query, headers=headers)
    # print('resp:',resp.text)
    if not resp:
        return []
    resp.encoding = 'UTF-8'
    return BeautifulSoup(resp.text, 'html.parser')

items = []
def search_momo(query,query_type):
    dom = get_search_content(query,query_type)
    # print(dom)
    if dom:
        
        name = dom.findAll("p", {"class": "prdName"})
        print("name:",name)
        price = dom.findAll("b", {"class": "price"})
        img = dom.findAll("div",{"class": "prdImgWrap"})
        item_name = name[0].text.replace("\r\n             ", "").replace("\r\n            ", "")
        item_price = price[0].text
        item_img_url = img[0].img['src']
        item_productUrl = "https://m.momoshop.com.tw" + name[0].parent.get('href')
        item = {
            "name": item_name.replace(' ',''),
            "price": item_price.replace('$', ''),
            "specialPrice": search_product_specialPrice(item_productUrl),
            "img_url": item_img_url,
            "productUrl": item_productUrl,
            "disc":search_product_intro(item_productUrl),
        }
        
        items.append(item)
        return items

def search_product_specialPrice(query):
    dom = get_product_content(query)
    if dom:
        attr = dom.findAll("td",{"class": "priceArea"})
        return attr[0].b.get_text()

def search_product_intro(query):
    dom = get_product_content(query)
    # print(dom)
    if dom:
        
        attr = dom.findAll("div",{"class": "attributesArea"})
        td = attr[0].table.find_all('td')
        th = attr[0].table.find_all('th')
        discString = th[2].get_text() + "是"
        # print(attr[0].table.find_all('td')[2].ul.li.get_text())
        # print(attr[0].table.find_all('td')[2].ul.find_all('li'))

        for link in td[2].ul.find_all('li'):
            discString += link.get_text() + "、"
        discString = discString[:-1]
        discString +=  "，" + th[3].get_text() + "是"
        for link in td[3].ul.find_all('li'):
            discString += link.get_text() + "、"
        discString = discString[:-1]
        discString += "。"

        return discString

# Python code to check for empty list 
# IMPLICIT way or Pythonic way 
def Enquiry(lis1): 
    if not lis1: 
        return 1
    else: 
        return 0

# query = '衛生紙'  #要搜尋的產品
print("start search...")
query = sys.argv[1]
query_adj = sys.argv[2]
product = search_momo(query,query_adj)[0]
print("query:"+query)

if len(sys.argv) <4:
    print(json.dumps(product,indent=2,ensure_ascii=False))
else:
    query = sys.argv[3]
    product = search_momo(query,query_adj)[0]
    print(json.dumps(items,indent=2,ensure_ascii=False)) 
# product = search_momo(query,"expensiveFirst")[0]
# print(json.dumps(product,indent=2,ensure_ascii=False))
# product = search_momo(query,"overall")[0]
print(json.dumps(product,indent=2,ensure_ascii=False))
sys.stdout.flush()
