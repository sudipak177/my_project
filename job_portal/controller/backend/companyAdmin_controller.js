const companyModel = require("../../Model/backend/companyAdmin_model");
const removeFile = require("../../middleware/removeFile");
const applyModel = require("../../Model/apply_model");

const companyAdminController = async (req, res) => {
  const auth = req.session.auth;
  if (auth) {
    const company = await companyModel.companyAdmin.getCompanyById(auth.id);
    return res.render("backend/companyAdmin", {
      title: "Admin page",
      favicon: "/static/images/logo.jpeg",
      layout: "backend",
      company: company[0],
      addedJob: req.flash("addedJob"),
    });
  }
  return res.redirect("/login");
};

// add jobs
const addJobsByCompany = async (req, res) => {
  const companyId = req.session.auth.id;

  try {
    if (!req.file || !req.isFileValid) {
      return res.status(400).send("Image is not valid or missing");
    }

    const fileName = req.file.filename;
    const body = req.body;
    const data = await companyModel.companyAdmin.addJobs(
      body,
      fileName,
      companyId
    );
    if (data) {
      req.flash("addedJob", "Job posted successfully");
      return res.redirect("/backend/companyAdmin");
    } else {
      removeFile(req.file.filename);
      console.log("Failed to add job to database");
      return res.status(500).send("Internal server error: Failed to add job");
    }
  } catch (error) {
    console.log("Error:", error);
    // If an error occurs, remove uploaded image and send error response
    if (req.file) {
      removeFile(req.file.filename);
    }
    return res.status(500).send("Internal server error: " + error.message);
  }
};

//job application

const renderJobApplication = async (req, res) => {
  try {
    const auth = req.session.auth;
    if (auth && auth.role === "company") {
      const company_id = req.session.auth.id;
      const appliedData = await applyModel.getAppliedJobsByCompany(company_id);
      return res.render("backend/applications", {
        title: "Job Applications",
        favicon: "/static/images/logo.jpeg",
        layout: "backend",
        appliedJobs: appliedData,
        changesStatus: req.flash("changesStatus"),
      });
    } else {
      return res.redirect("/backend/companyAdmin");
    }
  } catch (error) {
    console.log(error);
  }
};

// const deleteJobByCompany = async (req, res) => {
//   try {
//     const id = req.session.auth.id;
//     console.log(id);
//     if (!id) {
//       return res.status(400).send("Job ID  is missing in session");
//     }
//     const deleteJob = await companyModel.companyAdmin.deleteJobByCompany(id);
//     if (deleteJob) {
//       req.flash("deleteJob", "Job Deleted Successfully");
//       return res.redirect("/backend/companyAdmin/job");
//     } else {
//       // req.flash("cannot deleted");
//       return res.redirect("/backend/companyAdmin/job");
//     }
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send("Internal Server Error");
//   }
// };

//job accept or reject


async function changeStatus(req, res) {
const applicationId = req.body.applicationId;
const newStatus = req.body.status;
try{
  const data = await applyModel.changeStatus(applicationId, newStatus);
  console.log(data);
  if(data){
    req.flash("changesStatus", "Status Changed Successfully");
    return res.redirect("/backend/companyAdmin/application");
  }
}
  catch (error){
    console.log(error);
    res.status(500).json({error: "failed to update status."})
  }
}



// delete job functionality for company
const deleteJobByCompany = async (req, res) => {
  try {
    const jobId = req.params.id;
    const companyId = req.session.auth.id;

    // Check if jobId or companyId is missing
    if (!jobId || !companyId) {
      return res.status(400).send("Job ID or Company ID is missing");
    }

    const deleteJobImage = await companyModel.companyAdmin.getImageToDelete(
      jobId
    );

    if (deleteJobImage.length > 0) {
      await companyModel.companyAdmin.deleteJobByCompany(jobId, companyId);
      removeFile(deleteJobImage[0].image);
    }
    req.flash("deleteJob", "Job Deleted Successfully");
    return res.redirect("/backend/companyAdmin/job");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

//update job by company

const getJobUpdateForm = async (req, res) => {
  const jobId = req.params.id;
  const company_id = req.session.auth.id;
  const job = await companyModel.companyAdmin.getJobDataById(jobId, company_id);
  if (job.length > 0) {
    return res.render("backend/updatejob", {
      title: "Update Job",
      favicon: "/static/images/logo.jpeg",
      layout: "backend",
      jobData: job[0],
    });
  }
  return res.redirect("/backend/companyAdmin/job");
};


//update functions

const updateJobsByCompany = async (req, res) => {
  try {
    const file = req.file;
    const id = req.params.id;

    if (!id) {
      return res.status(400).send("Job ID is missing");
    }

    if (file) {
      // Updating job with a new image
      const imageName = file.filename;
      const oldImage = await companyModel.companyAdmin.getImageToDelete(id);

      if (!oldImage.length) {
        console.log("Old image not found");
        return res.status(404).send("Old image not found");
      }

      const jobData = await companyModel.companyAdmin.updateJobWithImage(req.body, imageName, id);

      if (jobData) {
        removeFile(oldImage[0].image);
        req.flash("updateJob", "Job updated successfully with new image");
        return res.redirect("/backend/companyAdmin/job");
      } else {
        console.log("Failed to update job with new image");
        return res.status(500).send("Failed to update job with new image");
      }
    } else {
      // Updating job without a new image
      const data = await companyModel.companyAdmin.updateJobWithoutImage(req.body, id);

      if (data) {
        req.flash("updateJob", "Job updated successfully");
        return res.redirect("/backend/companyAdmin/job");
      } else {
        console.log("Failed to update job without new image");
        return res.status(500).send("Failed to update job without new image");
      }
    }
  } catch (error) {
    console.log("Error during job update:", error);
    return res.status(500).send("Internal Server Error: " + error.message);
  }
};






module.exports = {
  companyAdminController,
  addJobsByCompany,
  // jobApplicationController,
  renderJobApplication,
  deleteJobByCompany,
  changeStatus,
  getJobUpdateForm,
  updateJobsByCompany,
};