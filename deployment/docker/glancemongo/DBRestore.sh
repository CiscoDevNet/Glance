echo "db server:"$1
echo "db name:"$2
echo "db Import path:"$3
mongorestore--host $1 --db  $2  $3




