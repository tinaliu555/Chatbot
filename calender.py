from __future__ import print_function
import datetime
import pickle
import os.path
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from dateutil.parser import parse as dtparse
from datetime import datetime as dt
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')
# https://developers.google.com/calendar/quickstart/python
start = '2018-12-26T10:00:00+01:00'   # Let's say your start value returns this as 'str'
tmfmt = '%Y %B %d, %H:%M %p'             # Gives you date-time in the format '26 December, 10:00 AM' as you mentioned

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

def getCalender(event_query):
    """Shows basic usage of the Google Calendar API.
    Prints the start and name of the next 10 events on the user's calendar.
    """
    creds = None
    # The file token.pickle stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    service = build('calendar', 'v3', credentials=creds)

    # Call the Calendar API
    now = datetime.datetime.utcnow().isoformat() + 'Z' # 'Z' indicates UTC time
    # print('now :',  now)
    # tomorrow = datetime.datetime.now() + datetime.timedelta(days=1)  
    
    # print('tomorrow :',  tomorrow)
    # print('tomorrow :',  datetime.time(tomorrow))
    # print('Getting the upcoming 10 events')
    events_result = service.events().list(calendarId='primary', q=event_query, timeMin=now,
                                        maxResults=10, singleEvents=True,
                                        orderBy='startTime').execute()
    events = events_result.get('items', [])
    # print(events)

    items = []
    for event in events:
        # start = event['start'].get('dateTime')
        start = event['start'].get('dateTime', event['start'].get('date'))
        # print(start, event['summary'])
        # now use the dtparse to read your event start time and dt.strftime to format it
        stime = dt.strftime(dtparse(start), format=tmfmt)
        # date_time_obj = datetime.datetime.strptime(start, '%Y-%m-%dT%H:%M:%SZ')
        # print(stime, event['summary'])
        item = {
            "FormulateTime": stime,
            "year": dt.strftime(dtparse(start), format="%Y"),
            "month": dt.strftime(dtparse(start), format="%#m"),
            "day": dt.strftime(dtparse(start), format="%#d"),
            "hour": dt.strftime(dtparse(start), format="%H"),
            "min": dt.strftime(dtparse(start), format="%#M"),
            "AmOrPm": dt.strftime(dtparse(start), format="%p"),
            "event": event['summary'],
        }
        items.append(item)
    return items

if __name__ == '__main__':
    result = getCalender(sys.argv[1])
    print(json.dumps(result,indent=2,ensure_ascii=False))
    sys.stdout.flush()