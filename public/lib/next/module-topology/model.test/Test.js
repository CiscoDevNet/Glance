module("topology-model");

// basic

TestGraphNew(nx.topology.model.Graph);
TestGraphNewData(nx.topology.model.Graph);
TestGraphCreateAddVertexEdge(nx.topology.model.Graph);
TestGraphRemoveVertexEdge(nx.topology.model.Graph);
TestGraphAddWrongVertexEdge(nx.topology.model.Graph);
TestGraphVertexEdges(nx.topology.model.Graph);
TestGraphMappingVertex(nx.topology.model.Graph);
TestGraphMappingEdge(nx.topology.model.Graph);

// collapsible

TestGraphNew(nx.topology.model.CollapsibleGraph);
TestGraphNewData(nx.topology.model.CollapsibleGraph);
TestGraphCreateAddVertexEdge(nx.topology.model.CollapsibleGraph);
TestGraphRemoveVertexEdge(nx.topology.model.CollapsibleGraph);
TestGraphAddWrongVertexEdge(nx.topology.model.CollapsibleGraph);
TestGraphVertexEdges(nx.topology.model.CollapsibleGraph);
TestGraphMappingVertex(nx.topology.model.CollapsibleGraph);
TestGraphMappingEdge(nx.topology.model.CollapsibleGraph);

TestCollapsibleGraphNew(nx.topology.model.CollapsibleGraph);
TestCollapsibleGraphNewData(nx.topology.model.CollapsibleGraph);
TestCollapsibleGraphCreateAddUnion(nx.topology.model.CollapsibleGraph);
TestCollapsibleGraphAddWrongUnion(nx.topology.model.CollapsibleGraph);
TestCollapsibleGraphCollapseRemoveUnion(nx.topology.model.CollapsibleGraph);
TestCollapsibleGraphCollapseWithEdge(nx.topology.model.CollapsibleGraph);
TestCollapsibleGraphAddRemoveEdge(nx.topology.model.CollapsibleGraph);
//TestCollapsibleGraphMappingUnion(nx.topology.model.CollapsibleGraph);
