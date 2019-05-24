/**
 * Created by tingxin on 5/19/15.
 */
//-----------------------------------------------
function MapHelper(){
}

MapHelper.getNearestAvailablePoint=function(x,y,map){
    var point=this.createPoint(x,y);

    if(map[point.y][point.x]!=0){
        return point;
    }
    else{
        var row=map.length;
        var interval=5;
        var lastStep=5;
        while(lastStep<row){

            var startX=point.x-lastStep;
            var endX=point.x+lastStep;
            while(startX<=endX){
                var baseP=Math.round(Math.sqrt(lastStep*lastStep-(startX-point.x)*(startX-point.x)));
                var startY1=point.y+baseP;
                var testPoint=this.createPoint(startX,startY1);
                try{
                    if(map[testPoint.y][testPoint.x]!=0)
                        return testPoint;
                }
                catch(ex) {
                    console.warn("point is ("+testPoint.x+","+testPoint.y+")");
                }


                var startY2=point.y-baseP;
                var testPoint2=this.createPoint(startX,startY2);

                try{
                    if(map[testPoint2.y][testPoint2.x]!=0)
                        return testPoint2;
                }
                catch(ex) {
                    console.warn("point is ("+testPoint2.x+","+testPoint2.y+")");
                }
                startX+=1;

            }
            lastStep=lastStep+interval;
        }

        return null;
    }
};

MapHelper.compareColor=function(color1,color2){

    var diff=10;
    if(Math.abs(color1.A-color2.A)<diff){
        if(Math.abs(color1.R-color2.R)<diff){
            if(Math.abs(color1.G-color2.G)<diff){
                if(Math.abs(color1.B-color2.B)<diff){
                    return true;
                }
            }
        }
    }
    return false;
}

MapHelper.getMapData=function(imgData){

    var rowNumber=img.height-1;
    var columnNumber=img.width-1;
    var map=[];
    var dataCount=imgData.data.length;
    var UNIT=4;

    var row=0;
    var column=0;
    map[row]=[];
    for(var index=0;index<dataCount;index+=4){

        var red=imgData.data[index+0];
        var green=imgData.data[index+1];
        var blue=imgData.data[index+2];
        var alpha=imgData.data[index+3];

        //var pointColor=new RGBColor(alpha,red,green,blue);
        if(alpha!=0){
            map[row][column]=0;
        }
        else{
            map[row][column]=1;
        }

        column++;
        if(column>columnNumber-1) {
            column=0;
            row++;
            if(row<rowNumber){
                map[row]=[];
            }
        }
    }
    MapHelper.column=map[0].length;
    MapHelper.row=map.length;
    return map;
};

MapHelper.createPoint=function(x,y){
    if(x>= MapHelper.column){
        x= MapHelper.column-1;
    }

    if(x<0){
        x=0;
    }
    if(y>=MapHelper.row){
        y=MapHelper.row-1;
    }

    if(y<0){
        y=0;
    }
    return {x:x,y:y};
};
