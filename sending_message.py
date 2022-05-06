from twilio.rest import Client
from twilio.rest import TwilioRestClient
import sys

# Your Account SID from twilio.com/console
account_sid = "AC4d142691725b6f4b90a2da8b3755cda6"
# Your Auth Token from twilio.com/console
auth_token  = "e7bd4ae7b7f68334f256a0ca9f1e91f2"
client = Client(account_sid, auth_token)

Felix = "+886 988 458 575"
Alice = "+886 926 807 680"
RJ = "+886 932 039 494"
sys.stdout.reconfigure(encoding='utf-8')

def sendText(phoneNumber):
    ##發短訊
    message = client.messages.create(
        to=phoneNumber,
        from_="+17069019102",
        body="主管好，我肚子不舒服，我明天要請假一天")

    print(message.sid)
    print(message.status)


def phoneCall(phoneNumber):
    # 打電話
    call = client.calls.create(
        to=phoneNumber,
        from_="+17069019102",
        url="https://handler.twilio.com/twiml/EH8f182723e805409de4a60c41b671444b"
    )

    print(call.sid)

if __name__ == '__main__':
    print('[sending_message.py] start')
    if(sys.argv[1]=="message"):
        print('[sending_message.py] 發簡訊到',Alice)
        sendText(Alice)
        # sendText(Felix)
        # print('[sending_message.py] 發簡訊到',RJ)
        # sendText(RJ)
    elif(sys.argv[1]=="call"):
        print('[sending_message.py] 打電話到',Alice)
        phoneCall(Alice)
        # phoneCall(Felix)
    elif(sys.argv[1]=="both"):
        print('[sending_message.py] 發簡訊到',Alice)
        # sendText(Alice)
        print('[sending_message.py] 打電話到',RJ)
        # phoneCall(Alice)
    sys.stdout.flush()