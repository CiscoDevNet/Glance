package services.cisco.poi;

import java.io.*;
import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import org.apache.poi.hssf.usermodel.HSSFCell;
import org.apache.poi.hssf.usermodel.HSSFRow;
import org.apache.poi.hssf.usermodel.HSSFSheet;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFCell;
import org.apache.poi.xssf.usermodel.XSSFRow;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.util.List;

/**
 * Created by kennych on 1/12/16.
 */
public class GlanceXLSXParser {

    public static ArrayList<ArrayList<String>> readXLSXFile(File file) throws IOException
    {
        InputStream ExcelFileToRead = new FileInputStream(file);
        XSSFWorkbook  wb = new XSSFWorkbook(ExcelFileToRead);
        XSSFSheet sheet = wb.getSheetAt(0);
        XSSFRow row;
        XSSFCell cell;

        ArrayList<ArrayList<String>> list=new ArrayList<>();

        Iterator rows = sheet.rowIterator();
        while (rows.hasNext())
        {
            ArrayList<String> values =new ArrayList<>();
            row=(XSSFRow) rows.next();
            for(int i=0;i<row.getLastCellNum();i++) {
                cell = row.getCell(i,HSSFRow.RETURN_NULL_AND_BLANK);
                if (cell == null){
                    values.add("");
                }else if(cell.getCellType() == XSSFCell.CELL_TYPE_STRING) {
                    values.add(cell.getStringCellValue().trim() + "");
                } else if (cell.getCellType() == XSSFCell.CELL_TYPE_NUMERIC) {
                    values.add((cell.getNumericCellValue() + "").trim());
                } else if (cell.getCellType() == XSSFCell.CELL_TYPE_BLANK) {
                    values.add("");
                } else {
                    values.add("undefined");
                }
            }
            list.add(values);
        }
        return list;
    }

    public static ArrayList<ArrayList<String>> readInterestPointXLSXFile(File file) throws IOException
    {
        InputStream ExcelFileToRead = new FileInputStream(file);
        XSSFWorkbook  wb = new XSSFWorkbook(ExcelFileToRead);
        XSSFSheet sheet = wb.getSheetAt(0);
        XSSFRow row;
        XSSFCell cell;

        ArrayList<ArrayList<String>> list=new ArrayList<>();

        Iterator rows = sheet.rowIterator();
        while (rows.hasNext())
        {
            ArrayList<String> values =new ArrayList<>();
            row=(XSSFRow) rows.next();
            Iterator cells = row.cellIterator();
            while (cells.hasNext())
            {
                cell=(XSSFCell) cells.next();

                if (cell.getCellType() == XSSFCell.CELL_TYPE_STRING) {
                    values.add(cell.getStringCellValue().trim()+"");
                }
                else if(cell.getCellType() == XSSFCell.CELL_TYPE_NUMERIC)
                {
                    try{
                        Date date =cell.getDateCellValue();
                        values.add((date.toString()+"").trim());
                    }catch( Exception e) {
                        values.add(cell.getNumericCellValue()+"".trim());
                    }
                }
                else if(cell.getCellType()== XSSFCell.CELL_TYPE_BLANK)
                {
                    values.add("");
                }else
                {
                    values.add("undefined");
                }
            }
            list.add(values);
        }
        return list;
    }

    public static Boolean WriteUserData(String fileName,List<String> columnNames,List<List<String>> values) throws FileNotFoundException,IOException
    {
        XSSFWorkbook wb = new XSSFWorkbook();
        XSSFSheet sheet = wb.createSheet("Glance Users") ;
        XSSFRow rowX = sheet.createRow(0);
        for(int clx=0;clx<columnNames.size();clx++) {
            XSSFCell cell = rowX.createCell(clx);
            cell.setCellValue(columnNames.get(clx));
        }

        int nCurrentIndex=0;
        for(int cl=0; cl < values.size();cl++)
        {
            List<String> record =values.get(cl);
            if(record.size()<columnNames.size())
                continue;
            XSSFRow row = sheet.createRow(nCurrentIndex+1);

            for(int cl2=0;cl2<columnNames.size();cl2++) {
                XSSFCell cell = row.createCell(cl2);
                cell.setCellValue(record.get(cl2));
            }
            nCurrentIndex +=1;
        }
        FileOutputStream fileOut = new FileOutputStream(fileName);
        wb.write(fileOut);
        fileOut.flush();
        fileOut.close();
        return true;
    }

}
