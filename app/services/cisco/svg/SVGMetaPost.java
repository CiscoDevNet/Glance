package services.cisco.svg;

//import java.io.File;
import java.io.IOException;
//import java.net.URI;
//import java.util.ArrayList;

import org.apache.batik.bridge.*;
import org.apache.batik.bridge.BridgeContext;
import org.apache.batik.bridge.DocumentLoader;
import org.apache.batik.bridge.GVTBuilder;
import org.apache.batik.bridge.UserAgent;
import org.apache.batik.bridge.UserAgentAdapter;
import org.apache.batik.dom.svg.SAXSVGDocumentFactory;
import org.apache.batik.dom.svg.SVGOMSVGElement;
import org.apache.batik.util.XMLResourceDescriptor;

import org.w3c.dom.Document;
import org.w3c.dom.NodeList;

/**
 * updated by kennych on 9/6/16.
 */
import org.apache.batik.dom.svg.*;
import org.apache.batik.dom.svg.SVGOMPathElement;
import org.apache.batik.dom.svg.SVGItem;

import org.w3c.dom.Node;
import org.w3c.dom.svg.SVGAnimatedRect;
import org.w3c.dom.svg.SVGPathSegList;
import play.Logger;

/**
 * Responsible for converting an SVG path element to MetaPost. This
 * will convert just the bezier curve portion of the path element, not
 * its style. Typically the SVG path data is provided from the "d" attribute
 * of an SVG path node.
 */

public class SVGMetaPost {
    private static final String PATH_ELEMENT_NAME = "path";

    private Document svgDocument;

    /**
     * Creates an SVG Document given a URI.
     *
     * @param uri Path to the file.
     * @throws Exception Something went wrong parsing the SVG file.
     */
    public SVGMetaPost( String uri ) throws IOException {
        setSVGDocument( createSVGDocument( uri ) );
    }

    /**
     * Finds all the path nodes and converts them to MetaPost code.
     */
    public void run() {
        NodeList pathNodes = getPathElements();
        int pathNodeCount = pathNodes.getLength();

        for( int iPathNode = 0; iPathNode < pathNodeCount; iPathNode++ ) {
            MetaPostPath mpp = new MetaPostPath( pathNodes.item( iPathNode ) );
            Logger.debug(mpp.toCode());
        }
    }

    public SVGAnimatedRect getViewBox()
    {
        return getSVGDocumentRoot().getViewBox();
    }

    /**
     * Returns a list of elements in the SVG document with names that
     * match PATH_ELEMENT_NAME.
     *
     * @return The list of "path" elements in the SVG document.
     */
    private NodeList getPathElements() {
        return getSVGDocumentRoot().getElementsByTagName( PATH_ELEMENT_NAME );
    }

    /**
     * Returns an SVGOMSVGElement that is the document's root element.
     *
     * @return The SVG document typecast into an SVGOMSVGElement.
     */
    private SVGOMSVGElement getSVGDocumentRoot() {
        return (SVGOMSVGElement)getSVGDocument().getDocumentElement();
    }

    /**
     * This will set the document to parse. This method also initializes
     * the SVG DOM enhancements, which are necessary to perform SVG and CSS
     * manipulations. The initialization is also required to extract information
     * from the SVG path elements.
     *
     * @param document The document that contains SVG content.
     */
    public void setSVGDocument( Document document ) {
        initSVGDOM( document );
        this.svgDocument = document;
    }

    /**
     * Returns the SVG document parsed upon instantiating this class.
     *
     * @return A valid, parsed, non-null SVG document instance.
     */
    public Document getSVGDocument() {
        return this.svgDocument;
    }

    /**
     * Enhance the SVG DOM for the given document to provide CSS- and SVG-specific
     * DOM interfaces.
     *
     * @param document The document to enhance.
     * @link http://wiki.apache.org/xmlgraphics-batik/BootSvgAndCssDom
     */
    private void initSVGDOM( Document document ) {
        UserAgent userAgent = new UserAgentAdapter();
        DocumentLoader loader = new DocumentLoader( userAgent );
        BridgeContext bridgeContext = new BridgeContext( userAgent, loader );
        bridgeContext.setDynamicState( BridgeContext.DYNAMIC );

        // Enable CSS- and SVG-specific enhancements.
        (new GVTBuilder()).build( bridgeContext, document );
    }

    /**
     * Use the SAXSVGDocumentFactory to parse the given URI into a DOM.
     *
     * @param uri The path to the SVG file to read.
     * @return A Document instance that represents the SVG file.
     * @throws Exception The file could not be read.
     */
    private Document createSVGDocument( String uri ) throws IOException {
        String parser = XMLResourceDescriptor.getXMLParserClassName();
        SAXSVGDocumentFactory factory = new SAXSVGDocumentFactory( parser );
        return factory.createDocument( uri );
    }
//    /**
//     * Reads a file and parses the path elements.
//     *
//     * @param args args[0] - Filename to parse.
//     * @throws IOException Error reading the SVG file.
//     */
//    public static void main( String args[] ) throws IOException {
//        URI uri = new File( args[0] ).toURI();
//        SVGMetaPost converter = new SVGMetaPost( uri.toString() );
//        converter.run();
//    }
}
