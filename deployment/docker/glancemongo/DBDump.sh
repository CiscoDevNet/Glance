echo "db server:"$1
echo "db name:"$2
echo "db out path:"$3
mongodump --host $1 --db  $2 --out $3


