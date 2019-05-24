# page refs
PAGE= \
	sanvy/ext/ExtraExtrudeGeometry.js \
	sanvy/benchmark.js \
	sanvy/Stage.js \
	sanvy/Object.js \
	sanvy/Mesh.js \
	glance/common/Util.js \
	glance/common/Icon.js \
	glance/common/IconBackspace.js \
	glance/common/IconClear.js \
	glance/common/BoundMixin.js \
	glance/common/BrandA.js \
	glance/common/BrandGlance.js \
	glance/common/LoadingCircle.js \
	glance/common/Dialog.js \
	glance/common/DialogUtil.js \
	glance/icon/BrandGlance.js \
	glance/routing/Router.js \
	glance/model/map/MapLoader.js \
	glance/model/map/MapModel.js \
	glance/model/ClientModel.js \
	glance/model/SearchModel.js \
	glance/model/LocationerModel.js \
	glance/model/FloorModel.js \
	glance/model/BuildingModel.js \
	glance/model/RouteModel.js \
	glance/model/CampusModel.js \
	glance/model/WorldModel.js \
	glance/model/ServerModel.js \
	glance/model/DevlistModel.js \
	glance/model/AdminModel.js \
	glance/service/Api.js \
	glance/service/Service.js \
	glance/perspective/search/HandWriter.js \
	glance/perspective/search/Keyboard.js \
	glance/perspective/search/InputPanel.js \
	glance/perspective/search/SearchBox.js \
	glance/perspective/search/NativeSearchBox.js \
	glance/perspective/Mark.js \
	glance/perspective/MarkImage.js \
	glance/perspective/MarkIcon.js \
	glance/perspective/MarkLabel.js \
	glance/perspective/Heater.js \
	glance/perspective/Shaper.js \
	glance/perspective/Heatmap3D.js \
	glance/perspective/Floor.js \
	glance/perspective/RoutePanel.js \
	glance/perspective/DialogDevice.js \
	glance/perspective/DialogDeviceDetail.js \
	glance/perspective/DialogProfile.js \
	glance/perspective/DialogProfileDetail.js \
	glance/perspective/DialogSendMessage.js \
	glance/perspective/DialogMarkDetail.js \
	glance/perspective/DialogPortrait.js \
	glance/perspective/DialogPersonDetail.js \
	glance/perspective/DialogThingDetail.js \
	glance/perspective/Header.js \
	glance/perspective/ControlPanel.js \
	glance/perspective/ControlPanelBubble.js \
	glance/perspective/StageControlPanel.js \
	glance/perspective/Building.js \
	glance/perspective/World.js \
	glance/perspective/DEMO.js \
	glance/perspective/Window.js \
	glance/paging/Header.js \
	glance/paging/InfoPanel.js \
	glance/paging/Page.js \
	glance/paging/PageSearch.js \
	glance/paging/PageCheckin.js \
	glance/paging/PageCheckout.js \
	glance/paging/Window.js \
	glance/paging/WindowCheck.js \
	glance/paging/WindowRegister.js \
	glance/editor/model/FontModel.js \
	glance/editor/model/VertexModel.js \
	glance/editor/model/EdgeModel.js \
	glance/editor/model/ShapeModel.js \
	glance/editor/model/SvgStrokeModel.js \
	glance/editor/model/SvgColorModel.js \
	glance/editor/model/SvgPathModel.js \
	glance/editor/model/MapEntranceModel.js \
	glance/editor/model/MapLabelModel.js \
	glance/editor/model/MapShapeModel.js \
	glance/editor/model/MapBarrierModel.js \
	glance/editor/model/MapWallModel.js \
	glance/editor/model/MapRegionModel.js \
	glance/editor/model/MapFacilityModel.js \
	glance/editor/model/MapModel.js \
	glance/editor/model/EditorModel.js \
	glance/editor/interact/Responsor.js \
	glance/editor/interact/ResponsorOfTemporaryShape.js \
	glance/editor/interact/ResponsorOnEditor.js \
	glance/editor/interact/ResponsorOnRegion.js \
	glance/editor/interact/ResponsorOnWall.js \
	glance/editor/interact/ResponsorOnBarrier.js \
	glance/editor/interact/ResponsorOnFacility.js \
	glance/editor/interact/ResponsorOnVertex.js \
	glance/editor/interact/ResponsorOnEdge.js \
	glance/editor/interact/ResponsorOnFace.js \
	glance/editor/interact/ResponsorOnBoundaryIdle.js \
	glance/editor/interact/ResponsorOnBoundaryWalls.js \
	glance/editor/interact/ResponsorOnBoundaryRegions.js \
	glance/editor/interact/ResponsorOnBoundaryBarriers.js \
	glance/editor/interact/ResponsorOnBoundaryFacilities.js \
	glance/editor/interact/Interactor.js \
	glance/editor/interact/InteractManager.js \
	glance/editor/MapShape.js \
	glance/editor/MapPathSegment.js \
	glance/editor/MapPathSegmentL.js \
	glance/editor/MapPathSegmentA.js \
	glance/editor/MapPathSegmentC.js \
	glance/editor/MapPathSegmentM.js \
	glance/editor/MapPath.js \
	glance/editor/MapLabel.js \
	glance/editor/MapBoundary.js \
	glance/editor/MapBarrier.js \
	glance/editor/MapWall.js \
	glance/editor/MapRegion.js \
	glance/editor/MapFacility.js \
	glance/editor/MapStage.js \
	glance/editor/EditorToolbar.js \
	glance/editor/Editor.js \
	glance/editor/EditorLoader.js \
	glance/editor/WindowHeader.js \
	glance/editor/Window.js \
	glance/admin/DialogLocationer.js \
	glance/admin/DialogDevlists.js \
	glance/admin/AdminFloorConfig.js \
	glance/admin/AdminFloorMap.js \
	glance/admin/AdminFloor.js \
	glance/admin/AdminDevlist.js \
	glance/admin/NavigatorPageServer.js \
	glance/admin/NavigatorPageDevice.js \
	glance/admin/Navigator.js \
	glance/admin/Header.js \
	glance/admin/Admin.js \
	glance/admin/DEMO.js \
	glance/admin/Window.js \
	glance/Application.js

# sed cross-platform
SED=$(or $(shell which gsed),$(shell which sed))

PAGE_SCRIPTS=$(shell echo $(PAGE) | $(SED) -n '1h;1!H;$${x;s/\(\S*\)/<script type="text\/javascript" src="\1"><\/script>/g;p}')

# next develop directory
NEXT_REPO:=../../../next/main

NEXT_DIR_REPO_TEST:=build/test
NEXT_DIR_REPO_DIST:=build/dist
NEXT_LIB:=lib/next
NEXT_DIR_LIB_TEST:=build/test
NEXT_DIR_LIB_DIST:=build/dist
NEXT_TEST_HTML_NAME:=next-web.html

NEXT_REPO_EXISTS=$(shell if [ -d $(NEXT_REPO) ]; then printf "yes"; fi)
NEXT_ROOT_DIR=$(if $(NEXT_REPO_EXISTS),$(NEXT_REPO),$(NEXT_LIB))
NEXT_ROOT_DIR_ESC=$(shell printf $(NEXT_ROOT_DIR) | $(SED) -e 's/\//\\\//g' | $(SED) -e 's/\./\\\./g')
NEXT_TEST_HTML=$(if $(NEXT_REPO_EXISTS),$(NEXT_DIR_REPO_TEST)/$(NEXT_TEST_HTML_NAME),$(NEXT_DIR_LIB_TEST)/$(NEXT_TEST_HTML_NAME))
NEXT_SCRIPTS_SRC=$(shell cat $(NEXT_ROOT_DIR)/$(NEXT_TEST_HTML) | $(SED) -n '1h;1!H;$${x;s/.*<!-- Test Code Start -->\r\?\n\s*\(.*\)\r\?\n\s*<!-- Test Code End -->.*/\1/g;p}' | $(SED) -n '1h;1!H;$${x;s/\.\.\/\.\.\/next-/$(NEXT_ROOT_DIR_ESC)\/next-/g;p}')
NEXT_SCRIPTS_DIST=<script type="text/javascript" src="lib/next/build/dist/next-web.min.js"></script>
NEXT_SCRIPTS=$(if $(DIST),$(NEXT_SCRIPTS_DIST),$(NEXT_SCRIPTS_SRC))

all: dist

dist: DIST=yes
dist: FORCE $(NEXT_LIB) index.html check.html admin.html

dev: DEV=yes
dev: FORCE $(NEXT_LIB) index.html check.html admin.html

$(NEXT_LIB): FORCE
ifeq ("$(NEXT_REPO_EXISTS)","yes")
	@printf "NEXT 2 repository detected.\n"
	@printf "Clear NEXT 2 ... "
	@mkdir -p lib
	@mkdir -p $(NEXT_LIB)
	@rm -rf $(NEXT_LIB)/*
	@printf "done.\n"
	@printf "Copy NEXT 2 ... "
	@mkdir -p $(NEXT_LIB)
	@cp -R $(NEXT_REPO)/module-* $(NEXT_LIB)/
	@mkdir -p $(NEXT_LIB)/$(NEXT_DIR_LIB_TEST)
	@cp $(NEXT_REPO)/$(NEXT_DIR_REPO_TEST)/next-*.html $(NEXT_LIB)/$(NEXT_DIR_LIB_TEST)
	@mkdir -p $(NEXT_LIB)/$(NEXT_DIR_LIB_DIST)
	@cp $(NEXT_REPO)/$(NEXT_DIR_REPO_DIST)/next-*.js $(NEXT_LIB)/$(NEXT_DIR_LIB_DIST)
	@printf "done.\n"
else
	@printf "NEXT 2 repository not detected.\n"
endif

index.html: FORCE
	@printf "Update index.html ... "
	@cp dev/index.template.html index.html
	@$(SED) index.html -e 's!\$$NEXT!$(NEXT_SCRIPTS)!g' -i
	@$(SED) index.html -e 's!\$$PAGE!$(PAGE_SCRIPTS)!g' -i
	@html-beautify index.html -r > /dev/null
	@printf "done.\n"

check.html: FORCE
	@printf "Update check.html ... "
	@cp dev/check.template.html check.html
	@$(SED) check.html -e 's!\$$NEXT!$(NEXT_SCRIPTS)!g' -i
	@html-beautify check.html -r > /dev/null
	@printf "done.\n"

admin.html: FORCE
	@printf "Update admin.html ... "
	@cp dev/admin.template.html admin.html
	@$(SED) admin.html -e 's!\$$NEXT!$(NEXT_SCRIPTS)!g' -i
	@html-beautify admin.html -r > /dev/null
	@printf "done.\n"

FORCE:
