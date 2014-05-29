export NOW=`date +%s`
export TESTDBPREFIX="testdb"
export TESTDBNAME="$TESTDBPREFIX$NOW"
export TESTDBPORT=`port=32768; while netstat -atn | grep -q :$port; do port=$(expr $port + 1); done; echo $port`
export TESTDBDIR=/dev/shm/$TESTDBNAME
# cleanup leftover crap
FOUND=`find /dev/shm/ -maxdepth 1 -mmin +10 -type d -regex ".*$TESTDBPREFIX.*" -print`
rm -fr $FOUND
echo $FOUND
mkdir $TESTDBDIR
$POSTGRESBINDIR/initdb --nosync $TESTDBDIR --encoding 'UTF-8' --lc-collate='en_US.UTF-8' --lc-ctype='en_US.UTF-8' 

# max_connections=11 as this is the poolSize for node-postgres
# plus the superuser_reserved_connections
#
# 	
#   

LOGGING=-c log_destination=stderr \
	-c log_statement=all \
	-c log_line_prefix="%t %c %u "

LOGGING=

$POSTGRESBINDIR/postgres \
	-c autovacuum=off \
	-c max_connections=11 \
	-c superuser_reserved_connections=1 \
	-c ssl=false \
	-c fsync=off \
	-c pgdocstore.admins_role=ds_admins \
	-c pgdocstore.users_role=ds_users \
	-c pgdocstore.active_user=unknown \
	$LOGGING \
	-D $TESTDBDIR -p $TESTDBPORT -k "" &
export TESTDBPID=$!
READY="1"
while ! [ $READY -eq 0 ]
do
	$POSTGRESBINDIR/pg_isready -q -h localhost -p $TESTDBPORT -d template1
	READY=$?
done

echo "TESTDBDIR=$TESTDBDIR"
echo "TESTDBPID=$TESTDBPID"
echo "TESTDBPORT=$TESTDBPORT"