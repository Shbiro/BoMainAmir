

############################ הרצת שרת pm2 ##################
#pm2 start Server.py --interpreter "C:\Users\USER\AppData\Local\Programs\Python\Python312\python.exe"



#התחברות ל ssh
#ssh -i "Amir.pem" ec2-user@ec2-51-20-244-254.eu-north-1.compute.amazonaws.com

#העלה לפרודקשן
#scp -i C:\Users\USER\source\repos\amir.pem -r build C:\Users\USER\source\repos\BoMainAmir\Server.js ec2-user@ec2-51-20-244-254.eu-north-1.compute.amazonaws.com:~/BoMainAmir


#שלב ראשון
#git init
#זה מייצר ריפוזיטורי


#שלב שני

#הוספת הקבצים למעקב על ידי git

# git add .
#sdas
# ביצוע שינויים כולל הערה על מה היה השינוי

# git commit - m "כך בוצע העדכון וכו'"

#git remote add origin https://github.com/username/repositoryname.git

# זה אם אני צריך remote

# העלה ראשונה
#git push -u origin main


# לייצר תיקיית .gitignore

# הוספת מספר דברים לקובץ הזה שאני רוצה שהוא לא יעלה לgit
# ReadmyPrivate.py
#node_modules/
#.env
#Amir.pem


# הוספת הקובץ ignore

#git add .gitignore
#git commit -m "הוספת שינוי בקובץ Server.js"


# העלה השינוים

# git push

# לאחר ביצוע שינויים הוספה למעקב 

#git add .
